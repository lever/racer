// If `racer` were written as an ES module, then it would have a default export
// that's an instance of Racer, plus exports of module classes/types like Model.
//
// However, this is a CommonJS module, and to correctly model it in TypeScript,
// we'd have to do `const racer = new Racer(); export = racer;`. Unfortunately,
// as of TypeScript 3.4, we can't merge namespaces into object variables:
// https://github.com/Microsoft/TypeScript/issues/18163
//
// That means we can't `export =` a Racer instance and also export
// classes/types. To work around this, we simulate the important Racer instance
// methods on the exported namespace.
export = racer;

declare namespace racer {
  // Simulate important Racer instance methods.

  /** Creates a new RacerBackend. Only available on the server. */
  export function createBackend(options?: ShareBackendOptions & {modelOptions?: ModelOptions}): RacerBackend;

  export function createModel(data?: ModelBundle): RootModel;

  // https://github.com/share/sharedb/blob/master/lib/backend.js
  interface ShareBackendOptions {
    db?: any;
    extraDbs?: {[extraDbName: string]: any};
    pubsub?: any;

    disableDocAction?: boolean;
    disableSpaceDelimitedActions?: boolean;
    maxSubmitRetries?: number;
    suppressPublish?: boolean;
  }

  //
  //     backend.js
  //

  class RacerBackend {
    createModel(options?: ModelOptions): RootModel;
  }

  //
  //     Model
  //

  export class Model<T> {
    static INITS: ModelInitsFn[];

    root: RootModel;

    // TODO: The Model class should be abstract, and this constructor
    // should be on the subclass RootModel.
    constructor(options?: ModelOptions);

    /** Returns a new Racer UUID. */
    id(): UUID;

    //
    //     Getter methods
    //

    /**
     * Returns a ChildModel scoped to a relative subpath under this model's path.
     */
    at<S>(subpath: Path): ChildModel<S>;
    at(): ChildModel<T>;

    /**
     * Returns a ChildModel scoped to an absolute path.
     */
    scope<S>(absolutePath: Path): ChildModel<S>;
    /**
     * Returns a ChildModel scoped to the root path.
     */
    scope(): ChildModel<racer.ModelData>;

    /**
     * Gets the value located at this model's path or a relative subpath.
     *
     * If no value exists at the path, this returns `undefined`.
     *
     * _Note:_ The value is returned by reference, and object values should not
     * be directly modified - use the Model mutator methods instead. The
     * TypeScript compiler will enforce no direct modifications, but there are
     * no runtime guards, which means JavaScript source code could still
     * improperly make direct modifications.
     */
    get<S>(subpath: Path): ReadonlyDeep<S> | undefined;
    get(): ReadonlyDeep<T> | undefined;

    /**
     * Gets a shallow copy of the value located at this model's path or a relative
     * subpath.
     *
     * If no value exists at the path, this returns `undefined`.
     */
    getCopy<S>(subpath: Path): ShallowCopiedValue<S> | undefined;
    getCopy(): ShallowCopiedValue<T> | undefined;

    /**
     * Gets a deep copy of the value located at this model's path or a relative
     * subpath.
     *
     * If no value exists at the path, this returns `undefined`.
     */
    getDeepCopy<S>(subpath: Path): S | undefined;
    getDeepCopy(): T | undefined;

    //
    //     Mutator methods
    //

    // This covers the JS interface, but it should eventually use stricter types
    // based on <T>.
    add(subpath: Path, doc: JSONObject, cb?: Callback): string;

    /**
     * Deletes the value at this model's path or a relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the old value at the path
     */
    del<S>(subpath: Path, cb?: Callback): S | undefined;
    del(cb?: Callback): T | undefined;

    /**
     * Increments the value at this model's path or a relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @param byNumber amount to increment/decrement. Defaults to `1`.
     * @returns the new number at the path
     */
    increment(subpath: Path, byNumber?: number, cb?: Callback): number;
    // Calling `increment()` with no arguments on a model pointing to a
    // non-number results in `N` being `never`, but it still compiles. Is
    // there a way to disallow that?
    increment<N extends number & T>(byNumber?: N, cb?: Callback): number;

    /**
     * Inserts one or more items at an index for the array at the path or
     * relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @param index 0-based index at which to insert the new items
     * @param values new item or items to insert
     * @returns the new length of the array
     */
    insert<V>(subpath: Path, index: number, values: V | V[], cb?: Callback): number;
    insert<V extends ArrayItemType<T>>(index: number, values: V | V[], cb?: Callback): number;

    /**
     * Adds an item to the end of the array at this model's path or a relative
     * subpath. If there's currently no value at the path, a new array is
     * automatically set to the path first.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the new length of the array
     */
    push<V>(subpath: Path, item: V, cb?: Callback): number;
    push<V extends ArrayItemType<T>>(item: V, cb?: Callback): number;

    /**
     * Removes one or more items from the array at this model's path or a
     * relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @param index 0-based index at which to start removing items
     * @param howMany number of items to remove, defaults to `1`
     * @returns array of the removed items
     */
    remove<V>(subpath: Path, index: number, howMany?: number, cb?: Callback): V[];
    // Calling `remove(n)` with one argument on a model pointing to a
    // non-array results in `N` being `never`, but it still compiles. Is
    // there a way to disallow that?
    remove<V extends ArrayItemType<T>>(index: number, howMany?: number, cb?: Callback): V[];

    /**
     * Sets the value at this model's path or a relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the value previously at the path
     */
    set<S>(subpath: Path, value: S, cb?: Callback): S | undefined;
    set(value: T): T | undefined;

    /**
     * Sets the value at this model's path or a relative subpath, if different
     * from the current value based on a strict equality comparison (`===`).
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the value previously at the path
     */
    setDiff<S>(subpath: Path, value: S, cb?: Callback): ReadonlyDeep<S> | undefined;
    setDiff(value: T): ReadonlyDeep<T> | undefined;

    /**
     * Sets the value at this model's path or a relative subpath, if different
     * from the current value based on a recursive deep equal comparison.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the value previously at the path
     */
    setDiffDeep<S>(subpath: Path, value: S, cb?: Callback): ReadonlyDeep<S> | undefined;
    setDiffDeep(value: T): ReadonlyDeep<T> | undefined;

    /**
     * Sets the value at this model's path or a relative subpath, only if there
     * isn't a value currently there. `null` and `undefined` count as no value.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the value currently at the path, if present, otherwise the `value`
     *   argument passed in
     */
    setNull<S>(subpath: Path, value: S, cb?: Callback): ReadonlyDeep<S> | undefined;
    setNull(value: T): ReadonlyDeep<T> | undefined;

    //
    //     Fetch, subscribe
    //

    fetch(items: Subscribable[], cb?: Callback): Model<T>;
    fetch(item: Subscribable, cb?: Callback): Model<T>;
    fetch(cb?: Callback): Model<T>;

    subscribe(items: Subscribable[], cb?: Callback): Model<T>;
    subscribe(item: Subscribable, cb?: Callback): Model<T>;
    subscribe(cb?: Callback): Model<T>;

    unfetch(items: Subscribable[], cb?: Callback): Model<T>;
    unfetch(item: Subscribable, cb?: Callback): Model<T>;
    unfetch(cb?: Callback): Model<T>;

    unsubscribe(items: Subscribable[], cb?: Callback): Model<T>;
    unsubscribe(item: Subscribable, cb?: Callback): Model<T>;
    unsubscribe(cb?: Callback): Model<T>;


    //
    //     Query
    //

    /**
     * Creates a query on a particular collection.
     *
     * This method does not trigger any data loading. To do so, fetch or
     * subscribe to the returned query.
     *
     * @param collectionName
     * @param expression query expression - query filters and other parameters
     * @param options
     */
    query<C extends string>(collectionName: C, expression: JSONObject, options?: JSONObject): Query<ModelData[C][string]>;

    //
    //     connection.js
    //

    /**
     * Calls the callback once all pending operations, fetches, and subscribes
     * have settled.
     */
    whenNothingPending(cb: Callback): void;

    //
    //     context.js
    //

    /**
     * Creates a new child model with a specific named data-loading context. The
     * child model has the same scoped path as this model.
     *
     * Contexts are used to track counts of fetches and subscribes, so that all
     * data relating to a context can be unloaded all at once, without having to
     * manually track loaded data.
     *
     * Contexts are in a global namespace for each root model, so calling
     * `model.context(contextId)` from two different places will return child
     * models that both refer to the same context.
     *
     * @param contextId context id
     * 
     * @see https://derbyjs.com/docs/derby-0.10/models/data-loading-contexts
     */
    context(contextId: string): ChildModel<T>;

    /**
     * Unloads data for this model's context, or for a specific named context.
     *
     * @param contextId optional context to unload; defaults to this model's context
     * 
     * @see https://derbyjs.com/docs/derby-0.10/models/data-loading-contexts
     */
    unload(contextId?: string): void;

    /**
     * Unloads data for all model contexts.
     * 
     * @see https://derbyjs.com/docs/derby-0.10/models/data-loading-contexts
     */
    unloadAll(): void;

    //
    //     Other methods that typically aren't used from outside Racer
    //

    bundle(cb: (err?: Error, bundle?: ModelBundle) => void): void;

    getCollection(collectionName: string): Collection<JSONObject>;

    destroy(subpath?: string): void;

    /**
     * Returns the absolute path for this model's path, plus an optional subpath.
     */
    path(subpath?: string): string;

    unbundle(data: ModelBundle): void;
  }

  // The JavaScript code doesn't have a RootModel class. Instead, the root model
  // is a Model that isn't a ChildModel. However, it really should have a
  // RootModel class, since collections.js adds `collections` and `data`
  // properties to root model instances.
  export interface RootModel extends Model<ModelData> {
    collections: CollectionMap;
    data: ModelData;
  }

  export class ChildModel<T> extends Model<T> {
    // EventEmitter methods access these properties directly, so they must be
    // inherited manually instead of via the root
    _events: any;
    _maxListeners: any;

    // Properties specific to a child instance
    _context: any;
    _at: string;
    _pass: any;
    _silent: any;
    _eventContext: any;
    _preventCompose: any;
  }

  type ModelOptions = {debug?: ModelDebugOptions} | ModelInitsFnOptions;

  type ModelInitsFn = (model: RootModel, options: ModelInitsFnOptions) => void;
  type ModelInitsFnOptions = {
    bundleTimeout?: number;  // bundle.js
    fetchOnly?: boolean;  // subscriptions.js
    unloadDelay?: number;  // subscriptions.js
  };

  type ModelDebugOptions = {
    disableSubmit?: boolean;  // RemoteDoc.js
    remoteMutations?: boolean;  // RemoteDoc.js
  };

  /**
   * A path string, a `Model`, or a `Query`.
   */
  type Subscribable = string | Model<unknown> | Query<unknown>;




  //
  // bundle.js
  //

  interface ModelBundle {
    queries: JSONObject;
    contexts: JSONObject;
    refs: JSONObject;
    refLists: JSONObject;
    fns: JSONObject;
    filters: JSONObject;
    collections: JSONObject;
  }




  //
  // collections.js
  //

  class CollectionMap {
    [collectionName: string]: Collection<JSONObject>;
  }
  /** Root model data */
  export class ModelData {
    [collectionName: string]: CollectionData<JSONObject>;
  }
  class DocMap {
    [id: string]: Doc;
  }
  /** Dictionary of document id to document data */
  export class CollectionData<T extends JSONObject> {
    [id: string]: T;
  }

  class Collection<T extends JSONObject> {
    model: RootModel;
    name: string;
    Doc: DocConstructor;
    docs: DocMap;
    data: CollectionData<T>;

    constructor(model: RootModel, name: string, Doc: DocConstructor);
  }

  type DocConstructor = {
    new(): LocalDoc | RemoteDoc;
  };




  //
  // Doc.js, LocalDoc.js, RemoteDoc.js
  //

  abstract class Doc {}
  class LocalDoc extends Doc {}
  class RemoteDoc extends Doc {}




  //
  // Query.js
  //

  export class Query<T> {
    constructor(model: Model<any>, collectionName: string, expression: JSONObject, options?: JSONObject);

    fetch(cb?: Callback): Query<T>;
    subscribe(cb?: Callback): Query<T>;
    unfetch(cb?: Callback): Query<T>;
    unsubscribe(cb?: Callback): Query<T>;

    get(): T[];
    getIds(): string[];
    getExtra(): JSONObject;
  }




  //
  // events.js
  //

  interface ListenerEventMap {
  }




  //
  // Simple and utility types
  //

  export type UUID = string;
  export type Path = string | number;
  export type PathSegment = string | number;

  type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
  type JSONObject = {
    [propName: string]: JSONValue;
    // Union with `object` below is a workaround to allow interfaces to work,
    // since interfaces don't work with the index signature above, but types do:
    // https://github.com/Microsoft/TypeScript/issues/15300
  } | object;
  interface JSONArray extends Array<JSONValue> { }

  /** If `T` is an array, produces the type of the array items. */
  type ArrayItemType<T> = T extends Array<infer U> ? U : never;

  type ReadonlyDeep<T> =
    // T extends Array<infer U> ? ReadonlyArrayDeep<U> :
    { readonly [K in keyof T]: ReadonlyDeep<T[K]> };

  // ReadonlyArrayDeep is not needed as of TypeScript 3.4.
  //
  // This was a workaround for recursive types:
  // https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
  interface ReadonlyArrayDeep<T> extends ReadonlyArray<ReadonlyDeep<T>> {}

  // Model#getCopy(...) returns a shallow copy. Direct edits on the returned
  // object's properties are fine, but direct edits deeper down are not OK.
  type ShallowCopiedValue<T> =
    T extends Array<infer U> ? Array<ReadonlyDeep<U>> :
    { [K in keyof T]: ReadonlyDeep<T[K]> };

  type Callback = (err?: Error) => void;
}
