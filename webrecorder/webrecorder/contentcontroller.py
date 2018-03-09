import re
import os
from six.moves.urllib.parse import quote, unquote

from bottle import Bottle, request, HTTPError, response, HTTPResponse, redirect

from pywb.utils.loaders import load_yaml_config
from pywb.rewrite.wburl import WbUrl
from pywb.rewrite.cookies import CookieTracker

from pywb.apps.rewriterapp import RewriterApp, UpstreamException

from webrecorder.basecontroller import BaseController
from webrecorder.load.wamloader import WAMLoader
from webrecorder.utils import get_bool

from webrecorder.models.dynstats import DynStats


# ============================================================================
class ContentController(BaseController, RewriterApp):
    DEF_REC_NAME = 'Recording Session'

    WB_URL_RX = re.compile('(([\d*]*)([a-z]+_|[$][a-z0-9:.-]+)?/)?([a-zA-Z]+:)?//.*')

    MODIFY_MODES = ('record', 'patch', 'extract')

    def __init__(self, *args, **kwargs):
        BaseController.__init__(self, *args, **kwargs)

        config = kwargs['config']

        config['csp-header'] = self.get_csp_header()

        # inited later
        self.browser_mgr = None

        RewriterApp.__init__(self,
                             framed_replay=True,
                             jinja_env=kwargs['jinja_env'],
                             config=config)

        self.paths = config['url_templates']

        self.cookie_tracker = CookieTracker(self.redis)

        self.record_host = os.environ['RECORD_HOST']
        self.live_host = os.environ['WARCSERVER_HOST']
        self.replay_host = os.environ.get('WARCSERVER_PROXY_HOST')
        if not self.replay_host:
            self.replay_host = self.live_host

        self.wam_loader = WAMLoader()
        self._init_client_archive_info()

        self.dyn_stats = DynStats(self.redis, config)

    def _init_client_archive_info(self):
        self.client_archives = {}
        for pk, archive in self.wam_loader.replay_info.items():
            info = {'name': archive['name'],
                    'about': archive['about'],
                    'prefix': archive['replay_prefix'],
                   }
            if archive.get('parse_collection'):
                info['parse_collection'] = True

            self.client_archives[pk] = info

    def get_csp_header(self):
        csp = "default-src 'unsafe-eval' 'unsafe-inline' 'self' data: blob: mediastream: ws: wss: "
        if self.content_host != self.app_host:
            csp += self.app_host + '/_set_session'

        csp += "; form-action 'self'"
        return csp

    def init_routes(self):
        @self.app.get(['/api/v1/client_archives', '/api/v1/client_archives/'])
        def get_client_archives():
            return self.client_archives

        @self.app.get(['/api/v1/create_remote_browser', '/api/v1/create_remote_browser/'])
        def create_browser():
            """ Api to launch remote browser instances
            """
            sesh = self.get_session()

            if sesh.is_new() and self.is_content_request():
                return {'error': 'Invalid request'}

            browser_id = request.query.br
            coll = request.query.coll
            rec = request.query.rec
            mode = request.query.mode
            user = self.get_user(redir_check=False)

            wb_url = WbUrl(request.query.wb_url)

            coll_obj = user.get_collection_by_name(coll)
            rec_obj = coll_obj.get_recording_by_name(rec)

            # build kwargs
            kwargs = dict(user=user['id'],
                          rec_orig=rec,
                          coll_orig=coll,
                          coll=quote(coll),
                          coll_name=coll_obj['title'],
                          rec=quote(rec, safe='/*'),
                          rec_name=rec_obj.get_title(),
                          type=mode,
                          remote_ip=self._get_remote_ip(),
                          ip=self._get_remote_ip(),
                          browser_can_write='1' if self.access.can_write_coll(coll_obj) else '0')

            data = self.browser_mgr.request_new_browser(browser_id,
                                                        wb_url,
                                                        kwargs)

            if 'error_message' in data:
                self._raise_error(400, data['error_message'])

            return data

        # REDIRECTS
        @self.app.route('/record/<wb_url:path>', method='ANY')
        def redir_new_temp_rec(wb_url):
            coll_name = 'temp'
            rec_name = self.DEF_REC_NAME
            wb_url = self.add_query(wb_url)
            return self.do_create_new_and_redir(coll_name, rec_name, wb_url, 'record')

        @self.app.route('/$record/<coll_name>/<rec_name>/<wb_url:path>', method='ANY')
        def redir_new_record(coll_name, rec_name, wb_url):
            wb_url = self.add_query(wb_url)
            return self.do_create_new_and_redir(coll_name, rec_name, wb_url, 'record')

        # API NEW
        @self.app.post('/api/v1/new')
        def api_create_new():
            self.redir_host()

            url = request.json.get('url')
            coll = request.json.get('coll')
            mode = request.json.get('mode')

            browser = request.json.get('browser')
            is_content = request.json.get('is_content') and not browser
            ts = request.json.get('ts')

            wb_url = self.construct_wburl(url, ts, browser, is_content)

            host = self.content_host if is_content else self.app_host
            if not host:
                host = request.urlparts.netloc

            full_url = request.environ['wsgi.url_scheme'] + '://' + host
            full_url += self.do_create_new(coll, '', wb_url, mode)

            return {'url': full_url}

        # COOKIES
        @self.app.get(['/<user>/<coll_name>/$add_cookie'], method='POST')
        def add_cookie(user, coll_name):
            user, collection = self.load_user_coll()

            rec_name = request.query.getunicode('rec', '*')
            recording = collection.get_collection_by_name(rec_name)

            name = request.forms.getunicode('name')
            value = request.forms.getunicode('value')
            domain = request.forms.getunicode('domain')

            if not domain:
                return {'error_message': 'no domain'}

            self.add_cookie(user, collection, recording, name, value, domain)

            return {'success': domain}

        # UPDATE REMOTE BROWSER CONFIG
        @self.app.get('/api/v1/update_remote_browser/<reqid>')
        def update_remote_browser(reqid):
            user, collection = self.load_user_coll(api=True)

            timestamp = request.query.getunicode('timestamp')
            type_ = request.query.getunicode('type')

            # if switching mode, need to have write access
            # for timestamp, only read access
            if type_:
                self.access.assert_can_write_coll(collection)
            else:
                self.access.assert_can_read_coll(collection)

            return self.browser_mgr.update_remote_browser(reqid,
                                                          type_=type_,
                                                          timestamp=timestamp)
        # PROXY
        @self.app.route('/_proxy/<url:path>', method='ANY')
        def do_proxy(url):
            return self.do_proxy(url)

        # LIVE DEBUG
        #@self.app.route('/live/<wb_url:path>', method='ANY')
        def live(wb_url):
            request.path_shift(1)

            return self.handle_routing(wb_url, user='$live', coll='temp', rec='', type='live')

        # EMDED
        @self.app.route('/_embed/<user>/<coll>/<wb_url:path>', method='ANY')
        def embed_replay(user, coll, wb_url):
            request.path_shift(3)
            #return self.do_replay_coll_or_rec(user, coll, wb_url, is_embed=True)
            return self.handle_routing(wb_url, user, coll, '*', type='replay-coll',
                                       is_embed=True)


        # DISPLAY
        @self.app.route('/_embed_noborder/<user>/<coll>/<wb_url:path>', method='ANY')
        def embed_replay(user, coll, wb_url):
            request.path_shift(3)
            #return self.do_replay_coll_or_rec(user, coll, wb_url, is_embed=True,
            #                                  is_display=True)
            return self.handle_routing(wb_url, user, coll, '*', type='replay-coll',
                                       is_embed=True, is_display=True)


        # CONTENT ROUTES
        # Record
        @self.app.route('/<user>/<coll>/<rec:path>/record/<wb_url:path>', method='ANY')
        def do_record(user, coll, rec, wb_url):
            request.path_shift(4)

            return self.handle_routing(wb_url, user, coll, rec, type='record', redir_route='record')

        # Patch
        @self.app.route('/<user>/<coll>/<rec>/patch/<wb_url:path>', method='ANY')
        def do_patch(user, coll, rec, wb_url):
            request.path_shift(4)

            return self.handle_routing(wb_url, user, coll, rec, type='patch', redir_route='patch')

        # Extract
        @self.app.route('/<user>/<coll>/<rec:path>/extract\:<archive>/<wb_url:path>', method='ANY')
        def do_extract_patch_archive(user, coll, rec, wb_url, archive):
            request.path_shift(4)

            return self.handle_routing(wb_url, user, coll, rec, type='extract',
                                       sources=archive,
                                       inv_sources=archive,
                                       redir_route='extract:' + archive)

        @self.app.route('/<user>/<coll>/<rec:path>/extract_only\:<archive>/<wb_url:path>', method='ANY')
        def do_extract_only_archive(user, coll, rec, wb_url, archive):
            request.path_shift(4)

            return self.handle_routing(wb_url, user, coll, rec, type='extract',
                                       sources=archive,
                                       inv_sources='*',
                                       redir_route='extract_only:' + archive)

        @self.app.route('/<user>/<coll>/<rec:path>/extract/<wb_url:path>', method='ANY')
        def do_extract_all(user, coll, rec, wb_url):
            request.path_shift(4)

            return self.handle_routing(wb_url, user, coll, rec, type='extract',
                                       sources='*',
                                       inv_sources='*',
                                       redir_route='extract')

        # REPLAY
        # Replay List
        @self.app.route('/<user>/<coll>/list/<list_id>/<wb_url:path>', method='ANY')
        def do_replay_rec(user, coll, list_id, wb_url):
            request.path_shift(4)

            return self.handle_routing(wb_url, user, coll, '*', type='replay-coll')

        # Replay Recording
        @self.app.route('/<user>/<coll>/<rec>/replay/<wb_url:path>', method='ANY')
        def do_replay_rec(user, coll, rec, wb_url):
            request.path_shift(4)

            return self.handle_routing(wb_url, user, coll, rec, type='replay')

        # Replay Coll
        @self.app.route('/<user>/<coll>/<wb_url:path>', method='ANY')
        def do_replay_coll(user, coll, wb_url):
            request.path_shift(2)

            return self.handle_routing(wb_url, user, coll, '*', type='replay-coll')

        # Session redir
        @self.app.route(['/_set_session'])
        def set_sesh():
            sesh = self.get_session()

            if self.is_content_request():
                id = request.query.getunicode('id')
                sesh.set_id(id)
                return self.redirect(request.query.getunicode('path'))

            else:
                url = request.environ['wsgi.url_scheme'] + '://' + self.content_host
                response.headers['Access-Control-Allow-Origin'] = url
                response.headers['Cache-Control'] = 'no-cache'

                redirect(url + '/_set_session?' + request.environ['QUERY_STRING'] + '&id=' + quote(sesh.get_id()))

        # OPTIONS
        @self.app.route('/_set_session', method='OPTIONS')
        def set_sesh_options():
            expected_origin = request.environ['wsgi.url_scheme'] + '://' + self.content_host + '/'
            origin = request.environ.get('HTTP_ORIGIN')
            # ensure origin is the content host origin
            if origin != expected_origin:
                return ''

            host = request.environ.get('HTTP_HOST')
            # ensure host is the app host
            if host != self.app_host:
                return ''

            response.headers['Access-Control-Allow-Origin'] = origin

            methods = request.environ.get('HTTP_ACCESS_CONTROL_REQUEST_METHOD')
            if methods:
                response.headers['Access-Control-Allow-Methods'] = methods

            headers = request.environ.get('HTTP_ACCESS_CONTROL_REQUEST_HEADERS')
            if headers:
                response.headers['Access-Control-Allow-Headers'] = headers

            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return ''

        @self.app.route(['/_clear_session'])
        def clear_sesh():
            sesh = self.get_session()
            sesh.delete()
            return self.redir_host(None, request.query.getunicode('path', '/'))

    def do_proxy(self, url):
        info = self.browser_mgr.init_cont_browser_sesh()
        if not info:
            return {'error_message': 'conn not from valid containerized browser'}

        try:
            kwargs = info
            user = info['the_user']
            collection = info['collection']
            recording = info['recording']

            if kwargs['type'] == 'replay-coll':
                collection.sync_coll_index(exists=False,  do_async=False)

            url = self.add_query(url)

            kwargs['url'] = url
            wb_url = kwargs.get('request_ts', '') + 'bn_/' + url

            request.environ['webrec.template_params'] = kwargs

            remote_ip = info.get('remote_ip')

            if remote_ip and info['type'] in self.MODIFY_MODES:
                if user.is_rate_limited(remote_ip):
                    raise HTTPError(402, 'Rate Limit')

            resp = self.render_content(wb_url, kwargs, request.environ)

            resp = HTTPResponse(body=resp.body,
                                status=resp.status_headers.statusline,
                                headers=resp.status_headers.headers)

            return resp

        except Exception as e:
            import traceback
            traceback.print_exc()

            @self.jinja2_view('content_error.html')
            def handle_error(status_code, err_body, environ):
                response.status = status_code
                kwargs['url'] = url
                kwargs['status'] = status_code
                kwargs['err_body'] = err_body
                kwargs['host_prefix'] = self.get_host_prefix(environ)
                kwargs['proxy_magic'] = environ.get('wsgiprox.proxy_host', '')
                return kwargs

            status_code = 500
            if hasattr(e, 'status_code'):
                status_code = e.status_code

            if hasattr(e, 'body'):
                err_body = e.body
            elif hasattr(e, 'msg'):
                err_body = e.msg
            else:
                err_body = ''

            return handle_error(status_code, err_body, request.environ)

    def check_remote_archive(self, wb_url, mode, wb_url_obj=None):
        wb_url_obj = wb_url_obj or WbUrl(wb_url)

        res = self.wam_loader.find_archive_for_url(wb_url_obj.url)
        if not res:
            return

        pk, new_url, id_ = res

        mode = 'extract:' + id_

        new_url = WbUrl(new_url).to_str(mod=wb_url_obj.mod)

        return mode, new_url

    def do_create_new_and_redir(self, coll_name, rec_name, wb_url, mode):
        new_url = self.do_create_new(coll_name, rec_name, wb_url, mode)
        return self.redirect(new_url)

    def do_create_new(self, coll_name, rec_name, wb_url, mode):
        if mode == 'record':
            result = self.check_remote_archive(wb_url, mode)
            if result:
                mode, wb_url = result

        rec_title = rec_name

        user = self.access.init_session_user()

        if user.is_anon():
            if self.anon_disabled:
                self.flash_message('Sorry, anonymous recording is not available.')
                self.redirect('/')
                return

            coll_name = 'temp'
            coll_title = 'Temporary Collection'

        else:
            coll_title = coll_name
            coll_name = self.sanitize_title(coll_title)

        collection = user.get_collection_by_name(coll_name)
        if not collection:
            collection = user.create_collection(coll_name, title=coll_title)

        recording = self._create_new_rec(collection, rec_title, mode)

        if mode.startswith('extract:'):
            patch_recording = self._create_new_rec(collection,
                                                   self.patch_of_name(rec_title),
                                                   'patch')

        new_url = '/{user}/{coll}/{rec}/{mode}/{url}'.format(user=user.my_id,
                                                             coll=collection.name,
                                                             rec=recording.name,
                                                             mode=mode,
                                                             url=wb_url)
        return new_url

    def is_content_request(self):
        if not self.content_host:
            return False

        return request.environ.get('HTTP_HOST') == self.content_host

    def redir_set_session(self):
        full_path = request.environ['SCRIPT_NAME'] + request.environ['PATH_INFO']
        full_path = self.add_query(full_path)
        self.redir_host(None, '/_set_session?path=' + quote(full_path))

    def _create_new_rec(self, collection, title, mode):
        rec_name = self.sanitize_title(title) if title else ''
        rec_type = 'patch' if mode == 'patch' else None
        return collection.create_recording(rec_name, desc=title, rec_type=rec_type)

    def patch_of_name(self, name, is_id=False):
        if not is_id:
            return 'Patch of ' + name
        else:
            return 'patch-of-' + name

    def handle_routing(self, wb_url, user, coll_name, rec_name, type,
                       is_embed=False,
                       is_display=False,
                       sources='',
                       inv_sources='',
                       redir_route=None):

        wb_url = self.add_query(wb_url)
        if user == '_new' and redir_route:
            return self.do_create_new_and_redir(coll_name, rec_name, wb_url, redir_route)

        sesh = self.get_session()

        if sesh.is_new() and self.is_content_request():
            self.redir_set_session()

        remote_ip = None
        frontend_cache_header = None
        patch_recording = None

        the_user, collection, recording = self.user_manager.get_user_coll_rec(user, coll_name, rec_name)

        coll = collection.my_id if collection else None
        rec = recording.my_id if recording else None

        if type in self.MODIFY_MODES:
            if not recording:
                self._redir_if_sanitized(self.sanitize_title(rec_name),
                                         rec_name,
                                         wb_url)

                # don't auto create recording for inner frame w/o accessing outer frame
                raise HTTPError(404, 'No Such Recording')

            elif not recording.is_open():
                # force creation of new recording as this one is closed
                raise HTTPError(404, 'Recording not open')

            collection.access.assert_can_write_coll(collection)

            if the_user.is_out_of_space():
                raise HTTPError(402, 'Out of Space')

            remote_ip = self._get_remote_ip()

            if the_user.is_rate_limited(remote_ip):
                raise HTTPError(402, 'Rate Limit')

            if inv_sources and inv_sources != '*':
                patch_rec_name = self.patch_of_name(rec, True)
                patch_recording = collection.get_recording_by_name(patch_rec_name)

        if type == 'replay-coll':
            if not collection:
                self._redir_if_sanitized(self.sanitize_title(coll_name),
                                         coll_name,
                                         wb_url)


                raise HTTPError(404, 'No Such Collection')

            access = self.access.check_read_access_public(collection)
            if not access:
                raise HTTPError(404, 'No Such Collection')

            if access != 'public':
                frontend_cache_header = ('Cache-Control', 'private')

        elif type == 'replay':
            if not recording:
                raise HTTPError(404, 'No Such Recording')

        request.environ['SCRIPT_NAME'] = quote(request.environ['SCRIPT_NAME'], safe='/:')

        wb_url = self._context_massage(wb_url)

        wb_url_obj = WbUrl(wb_url)

        is_top_frame = (wb_url_obj.mod == self.frame_mod or wb_url_obj.mod.startswith('$br:'))

        if type == 'record' and is_top_frame:
            result = self.check_remote_archive(wb_url, type, wb_url_obj)
            if result:
                mode, wb_url = result
                new_url = '/{user}/{coll}/{rec}/{mode}/{url}'.format(user=user,
                                                                     coll=coll_name,
                                                                     rec=rec_name,
                                                                     mode=mode,
                                                                     url=wb_url)
                return self.redirect(new_url)

        elif type == 'replay-coll' and not is_top_frame:
            collection.sync_coll_index(exists=False, do_async=False)

        kwargs = dict(user=user,
                      id=sesh.get_id(),
                      coll=coll,
                      rec=rec,
                      coll_name=quote(coll_name),
                      rec_name=quote(rec_name, safe='/*'),

                      the_user=the_user,
                      collection=collection,
                      recording=recording,
                      patch_recording=patch_recording,

                      type=type,
                      sources=sources,
                      inv_sources=inv_sources,
                      patch_rec=patch_recording.my_id if patch_recording else None,
                      ip=remote_ip,
                      is_embed=is_embed,
                      is_display=is_display)

        # top-frame replay but through a proxy, redirect to original
        if is_top_frame and 'wsgiprox.proxy_host' in request.environ:
            self.browser_mgr.update_local_browser(wb_url_obj, kwargs)
            return redirect(wb_url_obj.url)

        try:
            self.check_if_content(wb_url_obj, request.environ, is_top_frame)

            resp = self.render_content(wb_url, kwargs, request.environ)

            if frontend_cache_header:
                resp.status_headers.headers.append(frontend_cache_header)

            resp = HTTPResponse(body=resp.body,
                                status=resp.status_headers.statusline,
                                headers=resp.status_headers.headers)

            return resp

        except UpstreamException as ue:
            @self.jinja2_view('content_error.html')
            def handle_error(status_code, type, url, err_info):
                response.status = status_code
                return {'url': url,
                        'status': status_code,
                        'error': err_info.get('error'),
                        'user': user,
                        'coll': coll_name,
                        'rec': rec_name,
                        'type': type,
                        'app_host': self.app_host,
                       }

            return handle_error(ue.status_code, type, ue.url, ue.msg)

    def check_if_content(self, wb_url, environ, is_top_frame):
        if not wb_url.is_replay():
            return

        if not self.content_host:
            return

        if is_top_frame:
            if self.is_content_request():
                self.redir_host(self.app_host)
        else:
            if not self.is_content_request():
                self.redir_host(self.content_host)

    def _filter_headers(self, type, status_headers):
        if type in ('replay', 'replay-coll'):
            new_headers = []
            for name, value in status_headers.headers:
                if name.lower() != 'set-cookie':
                    new_headers.append((name, value))

            status_headers.headers = new_headers

    def _inject_nocache_headers(self, status_headers, kwargs):
        if 'browser_id' in kwargs:
            status_headers.headers.append(
                ('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
            )

    def _redir_if_sanitized(self, id, title, wb_url):
        if id != title:
            target = request.script_name.replace(title, id)
            target += wb_url
            self.redirect(target)

    def _context_massage(self, wb_url):
        # reset HTTP_COOKIE to guarded request_cookie for LiveRewriter
        if 'webrec.request_cookie' in request.environ:
            request.environ['HTTP_COOKIE'] = request.environ['webrec.request_cookie']

        try:
            del request.environ['HTTP_X_PUSH_STATE_REQUEST']
        except:
            pass

        #TODO: generalize
        if wb_url.endswith('&spf=navigate') and wb_url.startswith('mp_/https://www.youtube.com'):
            wb_url = wb_url.replace('&spf=navigate', '')

        return wb_url

    def add_query(self, url):
        if request.query_string:
            url += '?' + request.query_string

        return url

    def get_cookie_key(self, kwargs):
        sesh_id = self.get_session().get_id()
        return self.dyn_stats.get_cookie_key(kwargs['the_user'],
                                             kwargs['collection'],
                                             kwargs['recording'],
                                             sesh_id=sesh_id)

    def add_cookie(self, user, collection, recording, name, value, domain):
        sesh_id = self.get_session().get_id()
        key = self.dyn_stats.get_cookie_key(user,
                                            collection,
                                            recording,
                                            sesh_id=sesh_id)

        self.cookie_tracker.add_cookie(key, domain, name, value)

    def _get_remote_ip(self):
        remote_ip = request.environ.get('HTTP_X_REAL_IP')
        remote_ip = remote_ip or request.environ.get('REMOTE_ADDR', '')
        remote_ip = remote_ip.rsplit('.', 1)[0]
        return remote_ip

    ## RewriterApp overrides
    def get_base_url(self, wb_url, kwargs):
        # for proxy mode, 'upstream_url' already provided
        # just use that
        base_url = kwargs.get('upstream_url')
        if base_url:
            base_url = base_url.format(**kwargs)
            return base_url

        type = kwargs['type']

        base_url = self.paths[type].format(record_host=self.record_host,
                                           replay_host=self.replay_host,
                                           live_host=self.live_host,
                                           **kwargs)

        return base_url

    def process_query_cdx(self, cdx, wb_url, kwargs):
        rec = kwargs.get('rec')
        if not rec or rec == '*':
            rec = cdx['source'].split(':', 1)[0]

        cdx['rec'] = rec

    def get_host_prefix(self, environ):
        if self.content_host and 'wsgiprox.proxy_host' not in environ:
            return environ['wsgi.url_scheme'] + '://' + self.content_host
        else:
            return super(ContentController, self).get_host_prefix(environ)

    def get_top_url(self, full_prefix, wb_url, cdx, kwargs):
        if wb_url.mod != self.frame_mod and self.content_host != self.app_host:
            full_prefix = full_prefix.replace(self.content_host, self.app_host)

        return super(ContentController, self).get_top_url(full_prefix, wb_url, cdx, kwargs)

    def get_top_frame_params(self, wb_url, kwargs):
        type = kwargs['type']

        top_prefix = super(ContentController, self).get_host_prefix(request.environ)
        top_prefix += self.get_rel_prefix(request.environ)

        if type == 'live':
            return {'curr_mode': type,
                    'is_embed': kwargs.get('is_embed'),
                    'is_display': kwargs.get('is_display'),
                    'top_prefix': top_prefix}

        # refresh cookie expiration,
        # disable until can guarantee cookie is not changed!
        #self.get_session().update_expires()

        info = self.get_content_inject_info(kwargs['the_user'],
                                            kwargs['collection'],
                                            kwargs['recording'])

        return {'info': info,
                'curr_mode': type,

                'user': kwargs['user'],

                'coll': kwargs['coll'],
                'coll_name': kwargs['coll_name'],
                'coll_title': info.get('coll_title', ''),

                'rec': kwargs['rec'],
                'rec_name': kwargs['rec_name'],
                'rec_title': info.get('rec_title', ''),

                'is_embed': kwargs.get('is_embed'),
                'is_display': kwargs.get('is_display'),

                'top_prefix': top_prefix,

                'sources': kwargs.get('sources'),
                'inv_sources': kwargs.get('inv_sources'),
               }

    def _add_custom_params(self, cdx, resp_headers, kwargs):
        try:
            self._add_stats(cdx, resp_headers, kwargs)
        except:
            import traceback
            traceback.print_exc()

    def _add_stats(self, cdx, resp_headers, kwargs):
        type_ = kwargs['type']
        if type_ in ('record', 'live'):
            return

        source = cdx.get('source')
        if not source:
            return

        if source == 'local':
            source = 'replay'

        if source == 'replay' and type_ == 'patch':
            return

        orig_source = cdx.get('orig_source_id')
        if orig_source:
            source = orig_source

        ra_rec = None
        ra_recording = None

        # set source in recording-key
        if type_ in self.MODIFY_MODES:
            skip = resp_headers.get('Recorder-Skip')

            if not skip and source not in ('live', 'replay'):
                ra_rec = unquote(resp_headers.get('Recorder-Rec', ''))
                ra_rec = ra_rec or kwargs['rec']

                recording = kwargs.get('recording')
                patch_recording = kwargs.get('patch_recording')

                if recording and ra_rec == recording.my_id:
                    ra_recording = recording
                elif patch_recording and ra_rec == patch_recording.my_id:
                    ra_recording = patch_recording

        url = cdx.get('url')
        referrer = request.environ.get('HTTP_REFERER')

        if not referrer:
            referrer = url
        elif ('wsgiprox.proxy_host' not in request.environ and
            request.environ.get('HTTP_HOST') in referrer):
            referrer = url

        self.dyn_stats.update_dyn_stats(url, kwargs, referrer, source, ra_recording)

    def handle_custom_response(self, environ, wb_url, full_prefix, host_prefix, kwargs):
        # test if request specifies a containerized browser
        if wb_url.mod.startswith('$br:'):
            return self.handle_browser_embed(wb_url, kwargs)

        return RewriterApp.handle_custom_response(self, environ, wb_url, full_prefix, host_prefix, kwargs)

    def handle_browser_embed(self, wb_url, kwargs):
        #handle cbrowsers
        browser_id = wb_url.mod.split(':', 1)[1]

        kwargs['browser_can_write'] = '1' if self.access.can_write_coll(kwargs['collection']) else '0'

        kwargs['remote_ip'] = self._get_remote_ip()

        # container redis info
        inject_data = self.browser_mgr.request_new_browser(browser_id, wb_url, kwargs)
        if 'error_message' in inject_data:
            self._raise_error(400, inject_data['error_message'])

        inject_data.update(self.get_top_frame_params(wb_url, kwargs))
        inject_data['wb_url'] = wb_url

        @self.jinja2_view('browser_embed.html')
        def browser_embed(data):
            return data

        return browser_embed(inject_data)

    def get_content_inject_info(self, user, collection, recording):
        info = {}

        # recording
        if recording:
            info['rec_id'] = recording.name
            info['rec_title'] = quote(recording.get_title(), safe='/ ')
            info['size'] = recording.size

        else:
            info['size'] = collection.size

        # collection
        info['coll_id'] = collection.name
        info['coll_title'] = quote(collection.get_prop('title', collection.name), safe='/ ')

        info['coll_desc'] = quote(collection.get_prop('desc', ''))

        info['size_remaining'] = user.get_size_remaining()

        return info

    def construct_wburl(self, url, ts, browser, is_content):
        prefix = ts or ''

        if browser:
            prefix += '$br:' + browser
        elif is_content:
            prefix += 'mp_'

        if prefix:
            return prefix + '/' + url
        else:
            return url



