/*
 * @Description: 
 * @Author: Hexon
 * @Date: 2021-06-03 13:56:22
 * @LastEditors: Hexon
 * @LastEditTime: 2021-06-03 15:44:00
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
    executor(this.resolve, this.reject)
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
    if (this.state === REJECTED) {
      this.state = REJECTED
      this.value = err
      while (this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.shift()(err)
      }
    }
  }

  then = (onFulfilled, onRejected) => {
    if (this.state === FULFILLED) {
      onFulfilled(this.value)
    } else if (this.state === REJECTED) {
      onRejected(this.value)
    } else if (this.state === PENDING) {
      this.onFulfilledCallbacks.push(onFulfilled)
      this.onRejectedCallbacks.push(onRejected)
    }
  }
}

const testMyPromise = new MyPromise((resolve, reject) => {
  // 添加setTimeout后没有打印出resolve success，这是因为主线程立即执行，setTimeout是异步代码，属于macro task，
  // then会马上执行，此时state状态还是Pending，而在then函数中并未等待Pending状态，因此，没有打印信息
  setTimeout(() => {
    resolve('success')
  }, 2000)
  // reject('err')
})

// testMyPromise.then((val) => {
//   console.log('resolve ', val)
// }, (err) => {
//   console.log('reject ', err)
// })

testMyPromise.then(val => {
  console.log(1)
  console.log('resolve ', val)
})

testMyPromise.then(val => {
  console.log(2)
  console.log('resolve ', val)
})

testMyPromise.then(val => {
  console.log(3)
  console.log('resolve ', val)
})