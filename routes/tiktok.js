import express from 'express';
import axios from 'axios';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: '🚀 TikTok Downloader API is working!',
        timestamp: new Date().toISOString()
    });
});

// Simple test endpoint
router.get('/test-simple', (req, res) => {
    console.log('✅ Test endpoint called');
    res.json({ 
        success: true, 
        message: 'Simple test works! Server is responding.',
        timestamp: new Date().toISOString()
    });
});

// Enhanced video analysis with multiple APIs
router.post('/video-info', async (req, res) => {
    try {
        const { tiktokUrl } = req.body;
        
        console.log('📱 Analyzing TikTok URL:', tiktokUrl);

        if (!tiktokUrl) {
            return res.status(400).json({
                success: false,
                message: 'TikTok URL is required'
            });
        }

        // Validate TikTok URL format
        if (!tiktokUrl.includes('tiktok.com') && !tiktokUrl.includes('vm.tiktok.com') && !tiktokUrl.includes('vt.tiktok.com')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid TikTok URL format'
            });
        }

        console.log('🔧 Step 1: URL validation passed');

        // Try multiple API endpoints
        const apis = [
            `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`,
            `https://api.tiklydown.com/api/download?url=${encodeURIComponent(tiktokUrl)}`
        ];

        let videoData = null;
        let apiSource = '';
        let lastError = null;

        for (const apiUrl of apis) {
            try {
                console.log(`🔄 Trying API: ${apiUrl}`);
                const apiResponse = await axios.get(apiUrl, { 
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                console.log('📊 API Response status:', apiResponse.status);
                
                if (apiResponse.data && apiResponse.data.data) {
                    videoData = apiResponse.data.data;
                    apiSource = apiUrl.includes('tikwm') ? 'tikwm' : 'tiklydown';
                    console.log('✅ API success with:', apiSource);
                    break;
                } else {
                    console.log('❌ API returned no data');
                    lastError = 'No data from API';
                }
            } catch (error) {
                console.log(`❌ API failed: ${error.message}`);
                lastError = error;
                continue;
            }
        }

        if (!videoData) {
            console.log('❌ All APIs failed');
            return res.status(400).json({
                success: false,
                message: 'Failed to fetch video data from TikTok APIs',
                error: lastError?.message || 'All APIs failed'
            });
        }

        // Extract available qualities
        const qualities = [];
        if (videoData.play) qualities.push({ quality: 'standard', url: videoData.play });
        if (videoData.hdplay) qualities.push({ quality: 'hd', url: videoData.hdplay });
        if (videoData.wmplay) qualities.push({ quality: 'watermark', url: videoData.wmplay });

        console.log('✅ Video analysis completed with', apiSource);
        console.log('🎯 Available qualities:', qualities.map(q => q.quality));

        // Return video info
        res.json({
            success: true,
            message: 'Video analyzed successfully',
            data: {
                id: videoData.id || Date.now().toString(),
                title: videoData.title || 'TikTok Video',
                description: videoData.desc || videoData.title || '',
                author: {
                    nickname: videoData.author?.nickname || 'Unknown Creator',
                    uniqueId: videoData.author?.unique_id || 'unknown',
                    avatar: videoData.author?.avatar || ''
                },
                duration: videoData.duration || 0,
                cover: videoData.cover || videoData.thumbnail,
                music: videoData.music || videoData.music_info || {},
                statistics: {
                    likes: videoData.digg_count || videoData.like_count || 0,
                    shares: videoData.share_count || 0,
                    comments: videoData.comment_count || 0,
                    plays: videoData.play_count || 0,
                    downloads: videoData.download_count || 0
                },
                qualities: qualities,
                analyzedAt: new Date().toISOString(),
                apiSource: apiSource
            }
        });

    } catch (error) {
        console.error('❌ Analysis error:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Video analysis failed',
            error: error.message
        });
    }
});

// Simple download endpoint - No internal API calls
router.get('/download', async (req, res) => {
    try {
        const { url, quality = 'standard' } = req.query;
        
        console.log('📥 Download request:', { url, quality });

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'TikTok URL is required'
            });
        }

        // Direct API call to external TikTok APIs
        const apis = [
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
            `https://api.tiklydown.com/api/download?url=${encodeURIComponent(url)}`
        ];

        let videoData = null;

        for (const apiUrl of apis) {
            try {
                console.log(`🔄 Trying API: ${apiUrl}`);
                const apiResponse = await axios.get(apiUrl, { 
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (apiResponse.data && apiResponse.data.data) {
                    videoData = apiResponse.data.data;
                    console.log('✅ API success');
                    break;
                }
            } catch (error) {
                console.log(`❌ API failed: ${error.message}`);
                continue;
            }
        }

        if (!videoData) {
            return res.status(400).json({
                success: false,
                message: 'Failed to fetch video data from TikTok APIs'
            });
        }

        // Extract available qualities
        const qualities = [];
        if (videoData.play) qualities.push({ quality: 'standard', url: videoData.play });
        if (videoData.hdplay) qualities.push({ quality: 'hd', url: videoData.hdplay });
        if (videoData.wmplay) qualities.push({ quality: 'watermark', url: videoData.wmplay });

        // Find requested quality
        const qualityInfo = qualities.find(q => q.quality === quality) || qualities[0];
        
        if (!qualityInfo) {
            return res.status(400).json({
                success: false,
                message: 'No video quality available'
            });
        }

        console.log(`🎯 Downloading ${quality} quality from:`, qualityInfo.url);

        // Download video
        const videoResponse = await axios({
            method: 'GET',
            url: qualityInfo.url,
            responseType: 'stream',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });

        // Generate filename
        const author = videoData.author?.unique_id || 'tiktok';
        const videoId = videoData.id || Date.now();
        const filename = `tiktok_${author}_${videoId}.mp4`;
        const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Cache-Control', 'no-cache');

        console.log('✅ Starting video download');

        // Stream to browser
        videoResponse.data.pipe(res);

        videoResponse.data.on('end', () => {
            console.log('✅ Download completed');
        });

        videoResponse.data.on('error', (error) => {
            console.error('❌ Stream error:', error);
        });

    } catch (error) {
        console.error('❌ Download error:', error.message);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Download failed',
                error: error.message
            });
        }
    }
});

export default router;
