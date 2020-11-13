# 北邮疫情上报自动上报脚本

* 支持多用户
* 支持超时重报
* 支持上报结果推送至微信

### 使用方法

1. 复制配置文件编辑学号密码
    ```bash
    cp user.txt.example user.txt
    ```
2. 注册[server酱](http://sc.ftqq.com/3.version)拿到SCKEY
3. 将SCKEY配置到user.txt
4. 下载依赖
    ```bash
    yarn install
    ```
5. 编译
    ```bash
    tsc 
    ```
6. 运行
    ```bash
    node build/main.js
    ```

使用crontab配置到定时任务

### 参考
[bupt-ncov-report-action](https://github.com/imtsuki/bupt-ncov-report-action)
