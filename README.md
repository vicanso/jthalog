# 模块描述

用于haproxy的log收集， 以及分析HTTP LOG信息，生成相关的统计数据，需要使用到JTStatsClient，相关说明请参考： https://github.com/vicanso/jtstats_client


# API

- [start](#start)

- [addStatisticsHandler](#addStatisticsHandler)

<a name="start" />
## start
### 开始haproxy log收集

#### 参数列表

- options {logPath : 'log存放的文件目录', statsClient : JTStatsClient, port : '监听haproxy log的端口', 'host' : '监听的host'}，如果参数statsClient为空，则只将haproxy的log记录到文件，不做分析

```js
var jtHalog = require('jthalog');
var JTStatsClient = require('jtstats_client');
jtHalog.start({
  logPath : '/log/haproxy',
  port : '9200',
  host : '127.0.0.1',
  statsClient : new JTStatsClient({
    category : 'haproxy'
  })
});
```


<a name="addStatisticsHandler" />
## addStatisticsHandler
### 添加统计的处理函数

### 参数列表

- handler，处理函数，参数列表为：statsClient， infos

```js
var jtHalog = require('jthalog');
var JTStatsClient = require('jtstats_client');
jtHalog.start({
  logPath : '/log/haproxy',
  port : '9200',
  host : '127.0.0.1',
  statsClient : new JTStatsClient({
    category : 'haproxy'
  })
});
jtHalog.addStatisticsHandler(function(statsClient, infos){
  
});
```