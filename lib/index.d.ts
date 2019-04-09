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
  // Backend.js
  //

  class RacerBackend {
    createModel(options?: ModelOptions): RootModel;
  }

  //
  // Model
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
    at<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4]):
      ChildModel<T[K1][K2][K3][K4]>;
    at<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3]):
      ChildModel<T[K1][K2][K3]>;
    at<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2]):
      ChildModel<T[K1][K2]>;
    at<
        K1 extends DataPropNames<T>
      >(subpath: [K1]):
      ChildModel<T[K1]>;
    at(): ChildModel<T>;

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
    get<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4]):
      ReadonlyDeep<T[K1][K2][K3][K4]> | undefined;
    get<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3]):
      ReadonlyDeep<T[K1][K2][K3]> | undefined;
    get<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2]):
      ReadonlyDeep<T[K1][K2]> | undefined;
    get<
        K1 extends DataPropNames<T>
      >(subpath: [K1]):
      ReadonlyDeep<T[K1]> | undefined;
    get(): ReadonlyDeep<T> | undefined;

    /**
     * Gets a shallow copy of the value located at this model's path or a relative
     * subpath.
     *
     * If no value exists at the path, this returns `undefined`.
     */
    getCopy<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4]):
      ShallowCopiedValue<T[K1][K2][K3][K4]> | undefined;
    getCopy<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3]):
      ShallowCopiedValue<T[K1][K2][K3]> | undefined;
    getCopy<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2]):
      ShallowCopiedValue<T[K1][K2]> | undefined;
    getCopy<
        K1 extends DataPropNames<T>
      >(subpath: [K1]):
      ShallowCopiedValue<T[K1]> | undefined;
    getCopy(): ShallowCopiedValue<T> | undefined;

    /**
     * Gets a deep copy of the value located at this model's path or a relative
     * subpath.
     *
     * If no value exists at the path, this returns `undefined`.
     */
    getDeepCopy<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4]):
      T[K1][K2][K3][K4] | undefined;
    getDeepCopy<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3]):
      T[K1][K2][K3] | undefined;
    getDeepCopy<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2]):
      T[K1][K2] | undefined;
    getDeepCopy<
        K1 extends DataPropNames<T>
      >(subpath: [K1]):
      T[K1] | undefined;
    getDeepCopy(): T | undefined;

    //
    //     Mutator methods
    //

    // This covers the JS interface, but it should eventually use stricter types
    // based on <T>.
    add(subpath: string, doc: JSONObject): string;

    /**
     * Deletes the value at this model's path or a relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the old value at the path
     */
    del<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4], cb?: (error?: Error) => void):
      T[K1][K2][K3][K4] | undefined;
    del<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3], cb?: (error?: Error) => void):
      T[K1][K2][K3] | undefined;
    del<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2], cb?: (error?: Error) => void):
      T[K1][K2] | undefined;
    del<
        K1 extends DataPropNames<T>
      >(subpath: [K1], cb?: (error?: Error) => void):
      T[K1] | undefined;
    del(cb?: (error?: Error) => void): T | undefined;

    /**
     * Increments the value at this model's path or a relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @param byNumber amount to increment/decrement. Defaults to `1`.
     * @returns the new number at the path
     */
    increment<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends NumberPropNames<T[K1][K2][K3]>,
        N extends number & T[K1][K2][K3][K4],
      >(subpath: [K1, K2, K3, K4], byNumber?: N, cb?: (error?: Error) => void):
      number;
    increment<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends NumberPropNames<T[K1][K2]>,
        N extends number & T[K1][K2][K3],
      >(subpath: [K1, K2, K3], byNumber?: N, cb?: (error?: Error) => void):
      number;
    increment<
        K1 extends DataPropNames<T>,
        K2 extends NumberPropNames<T[K1]>,
        N extends number & T[K1][K2],
      >(subpath: [K1, K2], byNumber?: N, cb?: (error?: Error) => void):
      number;
    increment<
        K1 extends NumberPropNames<T>,
        N extends number & T[K1],
      >(subpath: [K1], byNumber?: N, cb?: (error?: Error) => void):
      number;
    increment<
        // Calling `increment()` with no arguments on a model pointing to a
        // non-number results in `N` being `never`, but it still compiles. Is
        // there a way to disallow that?
        N extends number & T
      >(byNumber?: N, cb?: (error?: Error) => void):
      number;

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
    insert<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends ArrayPropNames<T[K1][K2][K3]>,
        V extends ArrayItemType<T[K1][K2][K3][K4]>,
      >(subpath: [K1, K2, K3, K4], index: number, values: V | V[], cb?: (error?: Error) => void):
      number;
    insert<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends ArrayPropNames<T[K1][K2]>,
        V extends ArrayItemType<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3], index: number, values: V | V[], cb?: (error?: Error) => void):
      number;
    insert<
        K1 extends DataPropNames<T>,
        K2 extends ArrayPropNames<T[K1]>,
        V extends ArrayItemType<T[K1][K2]>,
      >(subpath: [K1, K2], index: number, values: V | V[], cb?: (error?: Error) => void):
      number;
    insert<
        K1 extends ArrayPropNames<T>,
        V extends ArrayItemType<T[K1]>,
      >(subpath: [K1], index: number, values: V | V[], cb?: (error?: Error) => void):
      number;
    insert<
        V extends ArrayItemType<T>
      >(index: number, values: V | V[], cb?: (error?: Error) => void):
      number;

    /**
     * Adds an item to the end of the array at this model's path or a relative
     * subpath. If there's currently no value at the path, a new array is
     * automatically set to the path first.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the new length of the array
     */
    push<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends ArrayPropNames<T[K1][K2][K3]>,
        V extends ArrayItemType<T[K1][K2][K3][K4]>,
      >(subpath: [K1, K2, K3, K4], item: V, cb?: (error?: Error) => void):
      number;
    push<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends ArrayPropNames<T[K1][K2]>,
        V extends ArrayItemType<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3], item: V, cb?: (error?: Error) => void):
      number;
    push<
        K1 extends DataPropNames<T>,
        K2 extends ArrayPropNames<T[K1]>,
        V extends ArrayItemType<T[K1][K2]>,
      >(subpath: [K1, K2], item: V, cb?: (error?: Error) => void):
      number;
    push<
        K1 extends ArrayPropNames<T>,
        V extends ArrayItemType<T[K1]>,
      >(subpath: [K1], item: V, cb?: (error?: Error) => void):
      number;
    push<
        V extends ArrayItemType<T>
      >(item: V, cb?: (error?: Error) => void):
      number;

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
    remove<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends ArrayPropNames<T[K1][K2][K3]>,
        V extends ArrayItemType<T[K1][K2][K3][K4]>,
      >(subpath: [K1, K2, K3, K4], index: number, howMany?: number, cb?: (error?: Error) => void):
      V[];
    remove<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends ArrayPropNames<T[K1][K2]>,
        V extends ArrayItemType<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3], index: number, howMany?: number, cb?: (error?: Error) => void):
      V[];
    remove<
        K1 extends DataPropNames<T>,
        K2 extends ArrayPropNames<T[K1]>,
        V extends ArrayItemType<T[K1][K2]>,
      >(subpath: [K1, K2], index: number, howMany?: number, cb?: (error?: Error) => void):
      V[];
    remove<
        K1 extends ArrayPropNames<T>,
        V extends ArrayItemType<T[K1]>,
      >(subpath: [K1], index: number, howMany?: number, cb?: (error?: Error) => void):
      V[];
    remove<
        // Calling `remove(n)` with one argument on a model pointing to a
        // non-array results in `N` being `never`, but it still compiles. Is
        // there a way to disallow that?
        V extends ArrayItemType<T>
      >(index: number, howMany?: number, cb?: (error?: Error) => void):
      V[];

    /**
     * Sets the value at this model's path or a relative subpath.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the value previously at the path
     */
    set<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4], value: T[K1][K2][K3][K4], cb?: (error?: Error) => void):
      T[K1][K2][K3][K4] | undefined;
    set<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3], value: T[K1][K2][K3], cb?: (error?: Error) => void):
      T[K1][K2][K3] | undefined;
    set<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2], value: T[K1][K2], cb?: (error?: Error) => void):
      T[K1][K2] | undefined;
    set<
        K1 extends DataPropNames<T>
      >(subpath: [K1], value: T[K1], cb?: (error?: Error) => void):
      T[K1] | undefined;
    set(value: T): T | undefined;

    /**
     * Sets the value at this model's path or a relative subpath, if different
     * from the current value based on a strict equality comparision (`===`).
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the value previously at the path
     */
    setDiff<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4], value: T[K1][K2][K3][K4], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2][K3][K4]> | undefined;
    setDiff<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3], value: T[K1][K2][K3], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2][K3]> | undefined;
    setDiff<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2], value: T[K1][K2], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2]> | undefined;
    setDiff<
        K1 extends DataPropNames<T>
      >(subpath: [K1], value: T[K1], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1]> | undefined;
    setDiff(value: T): ReadonlyDeep<T> | undefined;

    /**
     * Sets the value at this model's path or a relative subpath, if different
     * from the current value based on a recursive deep equal comparision.
     *
     * If a callback is provided, it's called when the write is finished.
     *
     * @returns the value previously at the path
     */
    setDiffDeep<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4], value: T[K1][K2][K3][K4], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2][K3][K4]> | undefined;
    setDiffDeep<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3], value: T[K1][K2][K3], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2][K3]> | undefined;
    setDiffDeep<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2], value: T[K1][K2], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2]> | undefined;
    setDiffDeep<
        K1 extends DataPropNames<T>
      >(subpath: [K1], value: T[K1], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1]> | undefined;
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
    setNull<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
        K4 extends DataPropNames<T[K1][K2][K3]>,
      >(subpath: [K1, K2, K3, K4], value: T[K1][K2][K3][K4], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2][K3][K4]> | undefined;
    setNull<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
        K3 extends DataPropNames<T[K1][K2]>,
      >(subpath: [K1, K2, K3], value: T[K1][K2][K3], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2][K3]> | undefined;
    setNull<
        K1 extends DataPropNames<T>,
        K2 extends DataPropNames<T[K1]>,
      >(subpath: [K1, K2], value: T[K1][K2], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1][K2]> | undefined;
    setNull<
        K1 extends DataPropNames<T>
      >(subpath: [K1], value: T[K1], cb?: (error?: Error) => void):
      ReadonlyDeep<T[K1]> | undefined;
    setNull(value: T): ReadonlyDeep<T> | undefined;

    //
    //     Other methods, typically not used from outside Racer
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
    _at: any;
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
  // events.js
  //

  interface ListenerEventMap {
  }




  //
  // Simple and utility types
  //

  export type UUID = string;
  export type PathSegment = string | number;

  type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
  type JSONObject = {
    [propName: string]: JSONValue;
    // Union with `object` below is a workaround to allow interfaces to work,
    // since interfaces don't work with the index signature above, but types do:
    // https://github.com/Microsoft/TypeScript/issues/15300
  } | object;
  interface JSONArray extends Array<JSONValue> { }

  /** Extracts the property names of `T` that are valid for use in a model. */
  type DataPropNames<T> =
    T extends Array<infer _V> ? (keyof T) & (number | 'length') :
    {
      [K in keyof T]: T[K] extends Function ? never : K
    }[keyof T];

  /** Extracts the property names of `T` whose values are arrays. */
  export type ArrayPropNames<T> = Exclude<{
    // The `undefined`s allow this to handle optional properties.
    [K in keyof T]: T[K] extends Array<infer _V> | undefined ? K : never
  }[keyof T], undefined>;

  /** Extracts the property names of `T` whose values are numbers. */
  export type NumberPropNames<T> = Exclude<{
    // The `undefined`s allow this to handle optional properties.
    [K in keyof T]: T[K] extends number | undefined ? K : never
  }[keyof T], undefined>;

  /** If `T` is an array, produces the type of the array items. */
  type ArrayItemType<T> = T extends Array<infer U> ? U : never;

  // Workaround for recursive types, suggested by TypeScript's lead architect:
  // https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
  type ReadonlyDeep<T> =
    T extends Array<infer U> ? ReadonlyArrayDeep<U> :
    { readonly [K in keyof T]: ReadonlyDeep<T[K]> };
  interface ReadonlyArrayDeep<T> extends ReadonlyArray<ReadonlyDeep<T>> {}

  // Model#getCopy(...) returns a shallow copy. Direct edits on the returned
  // object's properties are fine, but direct edits deeper down are not OK.
  type ShallowCopiedValue<T> =
    T extends Array<infer U> ? Array<ReadonlyDeep<U>> :
    { [K in keyof T]: ReadonlyDeep<T[K]> };
}
