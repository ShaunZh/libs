/*
 * @Description: 
 * @Author: Hexon
 * @Date: 2021-06-03 13:56:22
 * @LastEditors: Hexon
 * @LastEditTime: 2021-06-09 14:31:21
 */

const PENDING = 'pending';
const FULFILLED = 'resolve';
const REJECTED = 'REJECTED';

class MyPromise {
  constructor(executor) {
    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  state = PENDING
  value = null
  reason = null

  // 缓存fulfilled 和 rejected的回调函数
  onFulfilledCallbacks = []
  onRejectedCallbacks = []

  resolve = (val) => {
    if (this.state === PENDING) {
      this.state = FULFILLED
      this.value = val
      // 执行回调函数后，需要将对应的函数移出数组
      while (this.onFulfilledCallbacks.length) {
        this.onFulfilledCallbacks.shift()(val)
      }
    }
  }

  reject = (err) => {
    if (this.state === PENDING) {
      this.state = REJECTED
      this.reason = err
      while (this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.shift()(err)
      }
    }
  }

  then = (onFulfilled, onRejected) => {

    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    const promise2 = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        queueMicrotask(() => {
          try {
            let x = onFulfilled(this.value)
            // 判断返回值是否为promise，如果是，则执行then操作，如果不是在执行resolve
            resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }
      if (this.state === FULFILLED) {
        fulfilledMicrotask()
      } else if (this.state === REJECTED) {
        rejectedMicrotask()
      } else if (this.state === PENDING) {
        this.onFulfilledCallbacks.push(fulfilledMicrotask)
        this.onRejectedCallbacks.push(rejectedMicrotask)
      }
    })
    // 要实现then的链式调用，因此，必须返回一个promise
    return promise2
  }
  static resolve(parameter) {
    if (parameter instanceof MyPromise) {
      return parameter
    }

    return new MyPromise(resolve => {
      resolve(parameter)
    })
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }
}

function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  if (typeof x === 'object' || typeof x === 'function') {
    if (x === null) {
      return resolve(x);
    }

    let then;
    try {
      then = x.then
    } catch (err) {
      return reject(err)
    }

    if (typeof then === 'function') {
      let called = false;
      try {
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            resolvePromise(promise, y, resolve, reject);
          },
          r => {
            if (called) return;
            called = true;
            reject(r);
          }
        )
      } catch (err) {
        if (called) return;
        reject(err)
      }
    } else {
      resolve(x)
    }
  } else {
    resolve(x);
  }
}

MyPromise.deferred = function () {
  var result = {}
  result.promise = new MyPromise(function (resolve, reject) {
    result.resolve = resolve;
    result.reject = reject;
  })
  return result
}

module.exports = MyPromise
