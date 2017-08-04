import Vue from 'vue'
import AV from 'leancloud-storage'

var APP_ID = 'kytdRRDPWdOAsiIGv8vopVMS-gzGzoHsz';
var APP_KEY = 'T0jxtXkjizbsCj8EjDEbdMyy';
AV.init({
  appId: APP_ID,
  appKey: APP_KEY
});

var app = new Vue({
  el: '#app',
  data: {
    newTodo: '',
    todoList: [],
    actionType: 'signUp',
    currentUser: null,
    formData: {
      username: '',
      password: ''
    }
  },
  created: function () {
    // onbeforeunload文档：https://developer.mozilla.org/zh-CN/docs/Web/API/Window/onbeforeunload
    // window.onbeforeunload = () => {
    //   let dataString = JSON.stringify(this.todoList) // JSON 文档: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON
    //   var AVTodos = AV.Object.extend('AllTodos');
    //   var avTodos = new AVTodos();
    //   avTodos.set('content', dataString);
    //   avTodos.save().then(function (todo) {
    //     // 成功保存之后，执行其他逻辑.
    //     console.log('保存成功');
    //   }, function (error) {
    //     // 异常处理
    //     console.error('保存失败');
    //   });
    // }

    // 从 LeanCloud 读取 todos 的逻辑先不写
    //let oldDataString = window.localStorage.getItem('myTodos')
    //let oldData = JSON.parse(oldDataString)
    //this.todoList = oldData || []
    this.currentUser = this.getCurrentUser();
    this.fetchTodos()
  },
  methods: {
    fetchTodos: function () {
      if (this.currentUser) {
        var query = new AV.Query('AllTodos');
        query.find()
          .then((todos) => {
            let avAllTodos = todos[0] // 因为理论上 AllTodos 只有一个，所以我们取结果的第一项
            let id = avAllTodos.id
            this.todoList = JSON.parse(avAllTodos.attributes.content) // 为什么有个 attributes？因为我从控制台看到的
            this.todoList.id = id // 为什么给 todoList 这个数组设置 id？因为数组也是对象啊
          }, function (error) {
            console.error(error)
          })
      }
    },
    updateTodos: function () {
      // 想要知道如何更新对象，先看文档 https://leancloud.cn/docs/leanstorage_guide-js.html#更新对象
      let dataString = JSON.stringify(this.todoList) // JSON 在序列化这个有 id 的数组的时候，会得出怎样的结果？
      let avTodos = AV.Object.createWithoutData('AllTodos', this.todoList.id)
      avTodos.set('content', dataString)
      avTodos.save().then(() => {
        console.log('更新成功')
      })
    },
    saveTodos: function () {
      let dataString = JSON.stringify(this.todoList)
      var AVTodos = AV.Object.extend('AllTodos');
      var avTodos = new AVTodos();
      var acl = new AV.ACL();
      acl.setReadAccess(AV.User.current(), true) // 只有这个 user 能读
      acl.setWriteAccess(AV.User.current(), true) // 只有这个 user 能写
      avTodos.set('content', dataString);
      avTodos.setACL(acl)
      avTodos.save().then((todo) => {
        this.todoList.id = todo.id  // 一定要记得把 id 挂到 this.todoList 上，否则下次就不会调用 updateTodos 了
        console.log('保存成功');
      }, function (error) {
        console.log('保存失败');
      });
    },
    saveOrUpdateTodos: function () {
      if (this.todoList.id) {
        this.updateTodos()
      } else {
        this.saveTodos()
      }
    },
    addTodo: function () {
      this.todoList.push({
        title: this.newTodo,
        createdAt: new Date(),
        done: false // 添加一个 done 属性
      })
      this.newTodo = ''
      this.saveOrUpdateTodos()
    },
    // 加了👇这个函数
    removeTodo: function (todo) {
      let index = this.todoList.indexOf(todo) // Array.prototype.indexOf 是 ES 5 新加的 API
      this.todoList.splice(index, 1) // 不懂 splice？赶紧看 MDN 文档！
      this.saveOrUpdateTodos()
    },
    signUp: function () {
      let user = new AV.User();
      user.setUsername(this.formData.username);
      user.setPassword(this.formData.password);
      user.signUp().then((loginedUser) => { // 👈，将 function 改成箭头函数，方便使用 this

      }, (error) => {
        console.log('注册失败') // 👈
      });
    },
    login: function () {
      AV.User.logIn(this.formData.username, this.formData.password).then((loginedUser) => { // 👈
        this.currentUser = this.getCurrentUser() // 👈
        this.fetchTodos()
      }, function (error) {
        console.log('登录失败') // 👈
      });
    },
    getCurrentUser: function () { // 👈
      let current = AV.User.current()
      if (current) {
        let { id, createdAt, attributes: { username } } = current
        // 上面这句话看不懂就得看 MDN 文档了
        // 我的《ES 6 新特性列表》里面有链接：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        return { id, username, createdAt } // 看文档：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Object_initializer#ECMAScript_6%E6%96%B0%E6%A0%87%E8%AE%B0
      } else {
        return null
      }
    },
    logout: function () {
      AV.User.logOut()
      this.currentUser = null
      window.location.reload()
    }
  }
})

