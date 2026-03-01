import { AsyncLocalStorage } from "async_hooks";

type RequestContextStore = {
  requestId?: string;
};

const asyncLocalStorage = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  run<T>(store: RequestContextStore, callback: () => T) {
    return asyncLocalStorage.run(store, callback);
  },
  getRequestId() {
    return asyncLocalStorage.getStore()?.requestId;
  },
};
