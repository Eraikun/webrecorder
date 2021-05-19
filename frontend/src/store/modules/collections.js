import { fromJS, Map } from "immutable";
import config from "config";

const COLLS_LOAD = "wr/colls/LOAD";
const COLLS_LOAD_SUCCESS = "wr/colls/LOAD_SUCCESS";
const COLLS_LOAD_FAIL = "wr/colls/LOAD_FAIL";

const REVIEW_COLLS_LOAD = "wr/colls/REVIEW_LOAD";
const REVIEW_COLLS_LOAD_SUCCESS = "wr/colls/REVIEW_LOAD_SUCCESS";
const REVIEW_COLLS_LOAD_FAIL = "wr/colls/REVIEW_LOAD_FAIL";

const CREATE_COLL = "wr/coll/CREATE_COLL";
const CREATE_COLL_SUCCESS = "wr/coll/CREATE_COLL_SUCCESS";
const CREATE_COLL_FAIL = "wr/coll/CREATE_COLL_FAIL";

const COLL_SET_SORT = "wr/coll/COLL_SET_SORT";

const COLLECTIONS_REORDER = "wr/coll/COLL_REORDER";
const COLLECTIONS_REORDER_RĘVIEW = "wr/coll/COLL_REORDER_RĘVIEW";

const itemOrder = {
  open: 1,
  pending: 2,
  approved: 3,
  completed: 4,
  denied: 5,
};

const initialState = fromJS({
  collections: null,
  loading: false,
  loaded: false,
  error: null,
  creatingCollection: false,
  accessed: null,
  sortBy: fromJS({
    sort: "created_at",
    dir: "DESC",
  }),
  sortByReview: fromJS({
    sort: "created_at",
    dir: "DESC",
  }),
});

export default function collections(state = initialState, action = {}) {
  switch (action.type) {
    case COLLS_LOAD:
      return state.set("loading", true);
    case COLLS_LOAD_SUCCESS:
      return state.merge({
        loading: false,
        loaded: true,
        accessed: action.accessed,
        error: null,

        user: fromJS(action.result.user),
        collections: fromJS(action.result.collections)
          .sort((a, b) => sortByCreatedWithinStatus(a, b)),
      });
    case COLLS_LOAD_FAIL:
      return state.merge({
        loading: false,
        loaded: false,
        error: action.error,
      });
    case COLL_SET_SORT:
      console.log("COLL_SET_SORT" + JSON.stringify(action.sortBy, null, 2));
      return state.merge({ sortBy: action.sortBy });

    case COLLECTIONS_REORDER:
      console.log(action.collections);
      return state.merge({
        collections: action.collections
          .sort((a, b) => sortFn(a, b, state.get("sortBy")))
          .sort((a, b) => sortByStatus(a, b)),
      });
    case COLLECTIONS_REORDER_RĘVIEW:
      return state.merge({
        collections: action.collections
          .sort((a, b) => sortFn(a, b, state.get("sortByReview")))
          .sort((a, b) => sortByStatus(a, b)),
      });
    case REVIEW_COLLS_LOAD:
      return state.set("loading", true);
    case REVIEW_COLLS_LOAD_SUCCESS:
      console.log("review load success");
      return state.merge({
        loading: false,
        loaded: true,
        accessed: action.accessed,
        error: null,

        user: fromJS(action.result.user),
        collections: fromJS(action.result.collections)
          .sort((a, b) => sortByCreatedWithinStatus(a, b)),
      });
    case REVIEW_COLLS_LOAD_FAIL:
      return state.merge({
        loading: false,
        loaded: false,
        error: action.error,
      });
    case CREATE_COLL:
      console.log("coll create");
      return state.merge({
        creatingCollection: true,
        error: null,
      });
    case CREATE_COLL_SUCCESS:
      console.log("coll success");
      return state.merge({
        newCollection: action.result.collection.id,
        activeCollection: action.result.collection,
        creatingCollection: false,
        error: null,
        // nullify collections cache
        accessed: null,
      });
    case CREATE_COLL_FAIL:
      return state.set("error", action.error.error);

    default:
      return state;
  }
}

export function isLoaded({ app }) {
  return app.get("collections") && app.getIn(["collections", "loaded"]);
}

export function createCollection(
  user,
  title,
  url,
  isPublic,
  creatorList,
  subjectHeaderList,
  personHeaderList,
  noteToDachs,
  publisher,
  collTitle,
  publisherOriginal,
  collYear,
  copTitle,
  surName,
  persName,
  usermail,
  selectedGroupName,
  projektcode,
  publishYear,
  pubTitleOriginal,
  personHeadingText,
  subjectHeadingText,
  listID,
  ticketState,
  isCollLoaded,
  recordingUrl,
  recordingTimestamp,
  makePublic = false,
  doi = ""
) {
  return {
    types: [CREATE_COLL, CREATE_COLL_SUCCESS, CREATE_COLL_FAIL],
    promise: (client) =>
      client.post(`${config.apiPath}/collections`, {
        params: { user },
        data: {
          title,
          url,
          public: makePublic,
          public_index: true,
          creatorList,
          subjectHeaderList,
          personHeaderList,
          noteToDachs,
          publisher,
          collTitle,
          publisherOriginal,
          collYear,
          copTitle,
          surName,
          persName,
          usermail,
          selectedGroupName,
          projektcode,
          publishYear,
          pubTitleOriginal,
          personHeadingText,
          subjectHeadingText,
          listID,
          ticketState,
          isCollLoaded,
          recordingUrl,
          recordingTimestamp,
          doi,
        },
      }),
  };
}

export function create_collection_with_Warc(user, title) {
  return {
    types: [CREATE_COLL, CREATE_COLL_SUCCESS, CREATE_COLL_FAIL],
    promise: (client) =>
      client.post(`${config.apiPath}/collectionsduplicate`, {
        params: { user },
        data: {
          title,
        },
      }),
  };
}

export function load(user) {
  return {
    types: [COLLS_LOAD, COLLS_LOAD_SUCCESS, COLLS_LOAD_FAIL],
    accessed: Date.now(),
    promise: (client) =>
      client.get(`${config.apiPath}/collections`, {
        params: {
          user,
          include_pages: false,
          include_recordings: false,
          include_lists: false,
        },
      }),
  };
}
export function loadReviewList() {
  return {
    types: [
      REVIEW_COLLS_LOAD,
      REVIEW_COLLS_LOAD_SUCCESS,
      REVIEW_COLLS_LOAD_FAIL,
    ],
    accessed: Date.now(),
    promise: (client) =>
      client.get(`${config.apiPath}/review`, {
        params: {},
      }),
  };
}
const sortFn = (a, b, by = null) => {
  if (by) {
    if (a.get(by.get("sort")) > b.get(by.get("sort")))
      return by.get("dir") === "DESC" ? -1 : 1;
    if (a.get(by.get("sort")) < b.get(by.get("sort")))
      return by.get("dir") === "DESC" ? 1 : -1;
  } else {
    if (a > b) return -1;
    if (a < b) return 1;
  }
  return 0;
};
const sortByStatus = (statusA, statusB) => {
  var a = itemOrder[statusA.get("ticketState")];
  var b = itemOrder[statusB.get("ticketState")];
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
};

const sortByCreatedWithinStatus = (a,b) => {
  var t = itemOrder[a.get("ticketState")] - itemOrder[b.get("ticketState")];
   if (t == 0)
       return a.get("created_at") < b.get("created_at");
   else
       return t;
}
export function setSort(sortBy) {
  return {
    type: COLL_SET_SORT,
    sortBy,
  };
}

export function sortCollections(collections) {
  return {
    type: COLLECTIONS_REORDER,
    collections,
  };
}
export function sortCollectionsReview(collections) {
  return {
    type: COLLECTIONS_REORDER_RĘVIEW,
    collections,
  };
}
