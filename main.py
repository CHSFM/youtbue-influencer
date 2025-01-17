from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from googleapiclient.discovery import build
from dotenv import load_dotenv
import os

# 加载.env文件
load_dotenv()

app = FastAPI()

# 挂载静态文件
app.mount("/static", StaticFiles(directory="static"), name="static")

# 模板引擎
templates = Jinja2Templates(directory="templates")

# 获取YouTube API密钥
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
if not YOUTUBE_API_KEY:
    raise ValueError("请在.env文件中设置YOUTUBE_API_KEY")

# 初始化YouTube API服务
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/channel/{channel_id}")
async def get_channel_info(channel_id: str):
    # 获取频道信息
    channel_request = youtube.channels().list(
        part="snippet,statistics",
        id=channel_id
    )
    channel_response = channel_request.execute()
    
    if not channel_response["items"]:
        return {"error": "未找到该频道"}
        
    channel_info = channel_response["items"][0]
    
    # 获取视频列表
    search_request = youtube.search().list(
        part="snippet",
        channelId=channel_id,
        maxResults=50,
        order="date",
        type="video"
    )
    search_response = search_request.execute()
    
    # 获取视频详细信息
    video_ids = [item["id"]["videoId"] for item in search_response["items"]]
    videos_request = youtube.videos().list(
        part="snippet,statistics,contentDetails,status",
        id=",".join(video_ids)
    )
    videos_response = videos_request.execute()
    
    # 处理视频数据
    videos = []
    for video in videos_response["items"]:
        videos.append({
            "title": video["snippet"]["title"],
            "description": video["snippet"]["description"],
            "tags": video["snippet"].get("tags", []),
            "views": video["statistics"]["viewCount"],
            "likes": video["statistics"].get("likeCount", 0),
            "comments": video["statistics"].get("commentCount", 0),
            "duration": video["contentDetails"]["duration"],
            "category": video["snippet"]["categoryId"],
            "status": video["status"]["privacyStatus"],
            "id": video["id"]
        })
    
    return {
        "channel_id": channel_id,
        "title": channel_info["snippet"]["title"],
        "description": channel_info["snippet"]["description"],
        "created_at": channel_info["snippet"]["publishedAt"],
        "subscribers": channel_info["statistics"]["subscriberCount"],
        "views": channel_info["statistics"]["viewCount"],
        "videos": channel_info["statistics"]["videoCount"],
        "thumbnail": channel_info["snippet"]["thumbnails"]["high"]["url"],
        "video_list": videos
    }

@app.get("/comments/{video_id}")
async def get_video_comments(video_id: str):
    comments = []
    next_page_token = None
    
    # 最多获取200条评论
    while len(comments) < 200:
        request = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=100,
            pageToken=next_page_token,
            textFormat="plainText"
        )
        response = request.execute()
        
        for item in response["items"]:
            comment = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "author": comment["authorDisplayName"],
                "publishedAt": comment["publishedAt"],
                "text": comment["textDisplay"],
                "likeCount": comment["likeCount"]
            })
            
            if len(comments) >= 200:
                break
                
        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break
            
    return comments