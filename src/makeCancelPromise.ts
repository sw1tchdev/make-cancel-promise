export const clearSymbol = Symbol('clear');

const PROMISE_STATUSES = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
};

type PromiseExtended<T> = Promise<T> & { [clearSymbol]: (withReject?: boolean) => Promise<void>; }
type resolvePromise<T> = (value?: T | PromiseLike<T>) => void;
type rejectPromise = (reason?: unknown) => void;
type onCancelCallback = () => Promise<void> | void;
type onCancel = (onCancelCallback: onCancelCallback) => void;
type PromiseOnCancelExecutor<T> = (resolve: resolvePromise<T>, reject: rejectPromise, onCancel: onCancel) => void;

export class CancelablePromiseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CancelablePromiseError';
    }
}

export function makeCancelPromise<T>(executor: PromiseOnCancelExecutor<T>): PromiseExtended<T> {
    let cancelCallback: onCancelCallback | undefined;
    let resolveWrap: resolvePromise<T> | undefined;
    let rejectWrap: rejectPromise | undefined;

    let status = PROMISE_STATUSES.PENDING;

    const promise = new Promise((resolve, reject) => {
        const onCancel = (cb: onCancelCallback) => {
            cancelCallback = cb;
        };

        resolveWrap = (res) => {
            status = PROMISE_STATUSES.FULFILLED;
            return resolve(res);
        };

        rejectWrap = (res) => {
            status = PROMISE_STATUSES.REJECTED;
            return reject(res);
        };

        executor(resolveWrap, rejectWrap, onCancel);
    }) as PromiseExtended<T>;

    promise[clearSymbol] = async (withReject = true) => {
        if (status !== PROMISE_STATUSES.PENDING) {
            return;
        }

        if (withReject && rejectWrap && typeof rejectWrap === 'function') {
            rejectWrap(new CancelablePromiseError('Promise has been canceled'));
        }

        if (cancelCallback && typeof cancelCallback === 'function') {
            await cancelCallback();
        }
    };

    return promise;
}

export async function cancelPromise(...promises: PromiseExtended<unknown>[]): Promise<void> {
    const cancelPromises = promises.map((promise) => promise[clearSymbol]());
    await Promise.all(cancelPromises);
}

export default makeCancelPromise;

