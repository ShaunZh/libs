/*
 * @Description: 
 * @Author: Hexon
 * @Date: 2021-06-03 13:56:22
 * @LastEditors: Hexon
 * @LastEditTime: 2021-06-03 15:00:29
 */

const promise = new Promise((resolve, reject) => {
  resolve('success')
  reject('err')
})

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

  resolve = (val) => {
    if (this.state === PENDING) {
      this.state = FULFILLED
      this.value = val
    }
  }

  reject = (err) => {
    if (this.state === REJECTED) {
      this.state = REJECTED
      this.value = err
    }
  }

  then = (onFulfilled, onRejected) => {
    if (this.state === FULFILLED) {
      onFulfilled(this.value)
    } else if (this.state === REJECTED) {
      onRejected(this.value)
    }
  }
}

const testMyPromise = new MyPromise((resolve, reject) => {
  resolve('success')
  reject('err')
})

testMyPromise.then((val) => {
  console.log('resolve ', val)
}, (err) => {
  console.log('reject ', err)
})
