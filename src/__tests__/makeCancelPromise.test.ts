import {
    makeCancelPromise,
    clearSymbol, CancelablePromiseError,
    cancelPromise
} from '../makeCancelPromise';
import Bluebird from 'bluebird';

const globalPromise = Promise;

beforeEach(() => {
    global.Promise = globalPromise;
});

describe('makeCancelablePromise', () => {
    test('Test Resolve', async () => {
        const cancelablePromise = makeCancelPromise((resolve) => {
            resolve('its working');
            return;
        });
        await expect(cancelablePromise).resolves.toStrictEqual('its working');
    });

    test('Test Resolve Chain', async () => {
        const cancelablePromise = makeCancelPromise((resolve) => {
            resolve('its working');
            return;
        });
        return cancelablePromise
            .then((res) => makeCancelPromise(resolve => {
                resolve(`${res} from Chain`);
            })).then((res) => {
                expect(res).toStrictEqual('its working from Chain');
            });
    });

    test('Test Resolve Finally', async () => {
        expect.assertions(1);
        let isFinally = false;
        const cancelablePromise = makeCancelPromise((resolve) => {
            resolve('its working');
            return;
        });
        return cancelablePromise
            .then()
            .finally(() => {
                isFinally = true;
                expect(isFinally).toStrictEqual(true);
            });
    });

    test('Test Reject Finally', async () => {
        expect.assertions(2);
        let isFinally = false;
        const cancelablePromise = makeCancelPromise((_, reject) => {
            reject('its working');
            return;
        });
        return cancelablePromise
            .catch((e) => {
                expect(e).toStrictEqual('its working');
            })
            .finally(() => {
                isFinally = true;
                expect(isFinally).toStrictEqual(true);
            });
    });

    test('Test Reject With String', async () => {
        const cancelablePromise = makeCancelPromise((_, reject) => {
            reject('its working');
        });
        await expect(cancelablePromise).rejects.toStrictEqual('its working');
    });

    test('Test Reject With Error', async () => {
        const cancelablePromise = makeCancelPromise((_, reject) => {
            reject(new Error('test'));
        });
        await expect(cancelablePromise).rejects.toBeInstanceOf(Error);
    });

    test('Test Reject With Catch', () => {
        const cancelablePromise = makeCancelPromise((_, reject) => {
            reject(new Error('test'));
        });
        return cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(Error);
        });
    });

    test('Test Throw With Catch', () => {
        const cancelablePromise = makeCancelPromise((_, __) => {
            throw new Error('test');
        });
        return cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(Error);
        });
    });

    test('Test Throw Without Catch', async() => {
        const cancelablePromise = makeCancelPromise((_, __) => {
            throw new Error('test');
        });
        await expect(cancelablePromise).rejects.toThrow()
    });

    test('Returnable promise is instanceOf Promise', async () => {
        const cancelablePromise = makeCancelPromise((resolve) => {
            resolve('its working');
            return;
        });
        await expect(cancelablePromise).toBeInstanceOf(Promise);
    });

    test('Promise All', async () => {
        const result = await Promise.all([
            makeCancelPromise(resolve => {
                resolve(1);
            }),
            makeCancelPromise(resolve => {
                resolve(2);
            })]);
        expect(result).toStrictEqual([1, 2]);
    });

    test('Promise BlueBird', async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        global.Promise = Bluebird;

        const result = await Bluebird.all([
            makeCancelPromise(resolve => {
                resolve(1);
            }),
            makeCancelPromise(resolve => {
                resolve(2);
            })]);

        expect(result).toStrictEqual([1, 2]);
    });
});

describe('clearSymbol', () => {
    test('Test clearSymbol without OnCancel', async () => {
        expect.assertions(1);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject) => {
                setTimeout(() => {
                    resolve('its working');
                }, 1);
                setTimeout(() => {
                    reject('its working');
                }, 2);
            });

        cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });

        await cancelablePromise[clearSymbol]();
    });

    test('Test clearSymbol with sync OnCancel', async () => {
        expect.assertions(3);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(() => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });

        cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });

        await cancelablePromise[clearSymbol]();
    });

    test('Test clearSymbol without Reject with sync OnCancel', async () => {
        expect.assertions(2);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(() => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });

        cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });

        await cancelablePromise[clearSymbol](false);
    });

    test('Test clearSymbol with sync OnCancel Try Catch', () => {
        expect.assertions(3);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(() => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });

        (async () => {
            try {
                await cancelablePromise;
            } catch (e) {
                expect(e).toBeInstanceOf(CancelablePromiseError);
            }
        })();

        return cancelablePromise[clearSymbol]().then();
    });

    test('Test clearSymbol with async OnCancel', async () => {
        expect.assertions(3);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(async () => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });

        cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });

        await cancelablePromise[clearSymbol]();
    });

    test('Test clearSymbol with async OnCancel Try Catch', () => {
        expect.assertions(3);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(async () => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });

        (async () => {
            try {
                await cancelablePromise;
            } catch (e) {
                expect(e).toBeInstanceOf(CancelablePromiseError);
            }
        })();

        return cancelablePromise[clearSymbol]().then();
    });

    test('Test clearSymbol when OnCancel callback throw error', () => {
        expect.assertions(2);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(async () => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    throw new Error('From OnCancel callback');
                });
            });

        (async () => {
            try {
                await cancelablePromise;
            } catch (e) {
                expect(e).toBeInstanceOf(CancelablePromiseError);
            }
        })();

        return cancelablePromise[clearSymbol]().then().catch((e) => {
            expect(e).toBeInstanceOf(Error);
        });
    });

    test('Test clearSymbol Promise race', async () => {
        expect.assertions(2);
        const promise1 = makeCancelPromise((resolve, reject, onCancel) => {
            const timeoutResolve = setTimeout(() => {
                resolve('its working');
            }, 1);
            const timeoutReject = setTimeout(() => {
                reject('its working');
            }, 2);
            // Its never execute because promise resolves first
            onCancel(async () => {
                clearTimeout(timeoutResolve);
                clearTimeout(timeoutReject);
                expect(timeoutResolve).toHaveProperty('_destroyed', true);
                expect(timeoutReject).toHaveProperty('_destroyed', true);
            });
        });
        const promise2 = makeCancelPromise((resolve, reject, onCancel) => {
            const timeoutResolve = setTimeout(() => {
                resolve('its working');
            }, 10);
            const timeoutReject = setTimeout(() => {
                reject('its working');
            }, 20);
            onCancel(async () => {
                clearTimeout(timeoutResolve);
                clearTimeout(timeoutReject);
                expect(timeoutResolve).toHaveProperty('_destroyed', true);
                expect(timeoutReject).toHaveProperty('_destroyed', true);
            });
        });
        await Promise.race([promise1, promise2]);
        await cancelPromise(promise1, promise2);
    });
});

describe('cancelPromise', () => {
    test('Test cancelPromise', async () => {
        expect.assertions(3);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(async () => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });

        cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });

        await cancelPromise(cancelablePromise);
    });

    test('Test cancelPromise when cancelPromise throw error', async () => {
        expect.assertions(4);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(async () => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                    throw new Error('test');
                });
            });

        cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });

        try {
            await cancelPromise(cancelablePromise);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test('Test cancelPromise with multiple Promises', async () => {
        expect.assertions(6);
        const cancelablePromise = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 1);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 2);
                onCancel(() => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });
        const cancelablePromiseSecond = makeCancelPromise(
            (resolve, reject, onCancel) => {
                const timeoutResolve = setTimeout(() => {
                    resolve('its working');
                }, 10);
                const timeoutReject = setTimeout(() => {
                    reject('its working');
                }, 20);
                onCancel(() => {
                    clearTimeout(timeoutResolve);
                    clearTimeout(timeoutReject);
                    expect(timeoutResolve).toHaveProperty('_destroyed', true);
                    expect(timeoutReject).toHaveProperty('_destroyed', true);
                });
            });

        cancelablePromise.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });
        cancelablePromiseSecond.catch((e) => {
            expect(e).toBeInstanceOf(CancelablePromiseError);
        });

        await cancelPromise(cancelablePromise, cancelablePromiseSecond);
    });
});
