document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('channelForm');
    const resultDiv = document.getElementById('result');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const channelId = document.getElementById('channelId').value.trim();
        if (!channelId) return;
        
        try {
            const response = await fetch(`/channel/${channelId}`);
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
                    `;
                    
                    videosBody.appendChild(row);
                });
            } else {
                document.getElementById('videosTable').classList.add('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('获取频道信息失败，请稍后重试');
        }
    });
});