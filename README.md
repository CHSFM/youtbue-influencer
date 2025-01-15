# YouTube Influencer 分析工具

## 项目简介
本项目用于分析YouTube频道数据，基于YouTube Data API v3开发。

## 环境设置

### 1. 使用Anaconda创建虚拟环境
```bash
conda create -n youtube-env python=3.9
conda activate youtube-env
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

## 配置文件说明

### .env 文件配置
1. 复制.env.example文件为.env
2. 在.env文件中配置以下内容：
```
YOUTUBE_API_KEY=your_api_key_here
```

## YouTube Data API v3 使用指南

### API Key 申请步骤
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 YouTube Data API v3
4. 创建API凭证
5. 获取API Key

### 使用限制
- 每日配额：10,000单位
- 每次搜索请求消耗：100单位
- 每次视频详情请求消耗：1单位

更多配额政策请参考：
- [YouTube Data API v3配额文档](https://developers.google.com/youtube/v3/getting-started#quota)
- [配额计算器](https://developers.google.com/youtube/v3/determine_quota_cost)

如需提升配额，请通过Google Cloud Console申请。

## 运行项目
```bash
python main.py