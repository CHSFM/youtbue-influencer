// 导出Excel文件
function exportToExcel(data, filename) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "评论");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('channelForm');
    const resultDiv = document.getElementById('result');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 获取配置值
        const apiKey = document.getElementById('apiKey').value.trim();
        const videoCount = parseInt(document.getElementById('videoCount').value);
        const commentCount = parseInt(document.getElementById('commentCount').value);
        
        const channelId = document.getElementById('channelId').value.trim();
        if (!channelId || !apiKey) {
            alert('请填写频道ID和API Key');
            return;
        }
        
        try {
            const response = await fetch(`/channel/${channelId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey,
                    videoCount,
                    commentCount
                })
            });
            const data = await response.json();
            
            if (data.error) {
                alert(data.error);
                return;
            }
            
            // 更新页面内容
            document.getElementById('channelTitle').textContent = data.title;
            document.getElementById('channelDescription').textContent = data.description;
            // 格式化日期
            const createdAt = new Date(data.created_at).toLocaleDateString();
            
            document.getElementById('createdAt').textContent = createdAt;
            document.getElementById('subscribers').textContent = data.subscribers;
            document.getElementById('views').textContent = data.views;
            document.getElementById('videos').textContent = data.videos;
            document.getElementById('channelThumbnail').src = data.thumbnail;
            
            // 显示结果
            resultDiv.classList.remove('hidden');
            
            // 填充视频数据
            const videosBody = document.getElementById('videosBody');
            videosBody.innerHTML = '';
            
            if (data.video_list && data.video_list.length > 0) {
                document.getElementById('videosTable').classList.remove('hidden');
                
                data.video_list.forEach(video => {
                    const row = document.createElement('tr');
                    
                    // 转换时长格式
                    const formatDuration = (duration) => {
                        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        const hours = parseInt(matches[1] || 0);
                        const minutes = parseInt(matches[2] || 0);
                        const seconds = parseInt(matches[3] || 0);
                        
                        let result = '';
                        if (hours > 0) result += `${hours}小时`;
                        if (minutes > 0) result += `${minutes}分`;
                        if (seconds > 0 || result === '') result += `${seconds}秒`;
                        
                        return result;
                    };

                    row.innerHTML = `
                        <td data-label="标题">${video.title}</td>
                        <td data-label="描述">${video.description}</td>
                        <td data-label="标签">${video.tags.join(', ')}</td>
                        <td data-label="观看次数">${video.views}</td>
                        <td data-label="点赞数">${video.likes}</td>
                        <td data-label="评论数">${video.comments}</td>
                        <td data-label="时长">${formatDuration(video.duration)}</td>
                        <td data-label="分类">${video.category}</td>
                        <td data-label="状态">${video.status}</td>
                        <td data-label="操作">
                            <button class="get-comments-btn" data-video-id="${video.id}">获取评论</button>
                        </td>
                    `;
                    
                    videosBody.appendChild(row);
                });
            } else {
                document.getElementById('videosTable').classList.add('hidden');
            }

            // 显示导出按钮
            document.getElementById('exportBtn').classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            alert('获取频道信息失败，请稍后重试');
        }
    });

    // 获取评论按钮点击事件
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('get-comments-btn')) {
            const videoId = e.target.dataset.videoId;
            const videoTitle = e.target.closest('tr').querySelector('td').textContent;
            
            try {
                const response = await fetch(`/comments/${videoId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        apiKey: document.getElementById('apiKey').value.trim(),
                        commentCount: parseInt(document.getElementById('commentCount').value)
                    })
                });
                const comments = await response.json();
                
                if (comments.error) {
                    alert(comments.error);
                    return;
                }

                // 格式化评论数据
                const formattedComments = comments.map(comment => ({
                    视频名称: videoTitle,
                    评论人名称: comment.author,
                    评论时间: new Date(comment.publishedAt).toLocaleString(),
                    评论内容: comment.text,
                    评论点赞数: comment.likeCount
                }));

                // 导出Excel
                exportToExcel(formattedComments, `${videoTitle}_评论`);
                
            } catch (error) {
                console.error('获取评论失败:', error);
                alert('获取评论失败，请稍后重试');
            }
        }
    });

    // 导出按钮点击事件
    document.getElementById('exportBtn').addEventListener('click', function() {
        const channelTitle = document.getElementById('channelTitle').textContent;
        const channelInfo = {
            '频道名称': channelTitle,
            '创建时间': document.getElementById('createdAt').textContent,
            '订阅者人数': document.getElementById('subscribers').textContent
        };

        const videos = [];
        const rows = document.querySelectorAll('#videosBody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            videos.push({
                '视频标题': cells[0].textContent,
                '描述': cells[1].textContent,
                '标签': cells[2].textContent,
                '观看次数': cells[3].textContent,
                '点赞数': cells[4].textContent,
                '评论数': cells[5].textContent,
                '时长': cells[6].textContent,
                '分类': cells[7].textContent,
                '状态': cells[8].textContent
            });
        });

        // 合并频道信息和视频信息
        const data = videos.map(video => ({
            ...channelInfo,
            ...video
        }));

        // 生成文件名
        const today = new Date();
        const dateStr = today.getFullYear() + 
                       String(today.getMonth() + 1).padStart(2, '0') + 
                       String(today.getDate()).padStart(2, '0');
        const filename = `${channelTitle}_${dateStr}`;

        // 导出Excel
        exportToExcel(data, filename);
    });
});

// 加载xlsx库
const script = document.createElement('script');
script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
document.head.appendChild(script);