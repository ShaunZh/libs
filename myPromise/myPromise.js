/*
 * @Description: 
 * @Author: Hexon
 * @Date: 2021-06-03 13:56:22
 * @LastEditors: Hexon
 * @LastEditTime: 2021-06-08 09:59:54
 */

// 原生Promise实现
// const promise = new Promise((resolve, reject) => {
//   resolve('success')
//   reject('err')
// })
// promise.then(value => {
//   console.log('resolve', value)
// }, reason => {
//   console.log('reject', reason)
// })

const PENDING = 'pending'
const FULFILLED = 'resolve'
const REJECTED = 'REJECTED'

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
      this.value = err
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
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            let x = onRejected(this.value)
            this.resolvePromise(promise2, x, resolve, reject)
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

  resolvePromise = (promise2, p, resolve, reject) => {
    if (promise2 === p) {
      return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
    }
    if (p instanceof MyPromise) {
      // 执行 x，调用 then 方法，目的是将其状态变为 fulfilled 或者 rejected
      // x.then(value => resolve(value), reason => reject(reason))
      // 简化之后
      p.then(resolve, reject)
    } else {
      resolve(p)
    }
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

// const testMyPromise = new MyPromise((resolve, reject) => {
//   // 添加setTimeout后没有打印出resolve success，这是因为主线程立即执行，setTimeout是异步代码，属于macro task，
//   // then会马上执行，此时state状态还是Pending，而在then函数中并未等待Pending状态，因此，没有打印信息
//   // setTimeout(() => {
//   // throw new Error('test error')
//   // resolve('success')
//   // }, 2000)
//   reject('err')
// })

// // const p1 = testMyPromise.then(value => {
// //   console.log(1)
// //   console.log('resolve', value)
// //   return p1
// // })

// // 测试不传then参数
// testMyPromise.then().then().then(value => console.log(value))


// MyPromise.resolve().then(() => {
//   console.log(0);
//   return MyPromise.resolve(4);
// }).then((res) => {
//   console.log(res)
// })

// MyPromise.reject('test error').then(v => console.log('v', v), e => console.error(e))


// // 运行的时候会走reject
// testMyPromise.then(value => {
//   console.log(1)
//   console.log('resolve ', value)
//   throw new Error('then error')
// }, reason => {
//   console.log(2)
//   console.log(reason.message)
// }).then(value => {
//   console.log(3)
//   console.log('resolve ', value)
// }, error => {
//   console.log(4)
//   console.log(error.message)
//   throw new Error('catch error')
// }).then(value => {
//   console.log(5)
//   console.log(value)
// }, error => {
//   console.log(6)
//   console.log(error.message)
// })


