# make-cancel-promise ![tests](https://github.com/sw1tchdev/make-cancel-promise/workflows/Tests/badge.svg) [![codecov](https://codecov.io/gh/sw1tchdev/make-cancel-promise/branch/master/graph/badge.svg)](https://codecov.io/gh/sw1tchdev/make-cancel-promise)
Make your promises cancelable

## Install
NPM:
```
npm install make-cancel-promise
```

## Features
1. Working with native, polyfills, shim'ed Promises
1. Isomorphic library
1. Zero dependencies
1. Typescript declarations

## Usage example
Basic usage
```javascript
import {
    makeCancelPromise, 
    CancelablePromiseError,
    cancelPromise
} from 'make-cancel-promise';

const cancelablePromise = makeCancelPromise(
    (resolve, reject, onCancel) => {
        const timeoutResolve = setTimeout(() => {
            resolve('resolve');
        }, 10);
        const timeoutReject = setTimeout(() => {
            reject('reject');
        }, 20);
        onCancel(() => {
            clearTimeout(timeoutResolve);
            clearTimeout(timeoutReject);
        });
});

cancelablePromise.catch((e) => {
    if(e instanceof CancelablePromiseError){
        console.log('Promise has been canceled');
    }       
});

cancelPromise(cancelablePromise).catch((e) => {
  console.error(e);
});
```

Cancel with ClearSymbol
```javascript
import {
    makeCancelPromise, 
    CancelablePromiseError, 
    clearSymbol
} from 'make-cancel-promise';

const cancelablePromise = makeCancelPromise(
    (resolve, reject, onCancel) => {
        const timeoutResolve = setTimeout(() => {
            resolve('resolve');
        }, 10);
        const timeoutReject = setTimeout(() => {
            reject('reject');
        }, 20);
        onCancel(async () => {
            clearTimeout(timeoutResolve);
            clearTimeout(timeoutReject);
            });
});

cancelablePromise.catch((e) => {
    if(e instanceof CancelablePromiseError){
        console.log('Promise has been canceled');
    }       
});

cancelablePromise[clearSymbol]().catch((e) => {
  console.error(e);
});
```

Cancel with ClearSymbol without rejecting (using in some of cases)  
**Warning: You must resolve or reject promise in onCancel callback manually to prevent a pending promises in memory**
```javascript
import {
    makeCancelPromise, 
    CancelablePromiseError, 
    clearSymbol
} from 'make-cancel-promise';

const cancelablePromise = makeCancelPromise(
    (resolve, reject, onCancel) => {
        const timeoutResolve = setTimeout(() => {
            resolve('resolve');
        }, 10);
        const timeoutReject = setTimeout(() => {
            reject('reject');
        }, 20);
        onCancel(async () => {
            clearTimeout(timeoutResolve);
            clearTimeout(timeoutReject);
        });
});

cancelablePromise.catch((e) => {
    if(e instanceof CancelablePromiseError){
        console.log('Promise has been canceled');
    }       
});

// passing false to "clearSymbol" function will be cancel promise without rejecting
cancelablePromise[clearSymbol](false).catch((e) => {
  console.error(e);
});
```
