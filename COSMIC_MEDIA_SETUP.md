# 🌌 Cosmic Media Setup Guide

## 🎥 Video Requirements

### Recommended Video Specifications
- **Resolution**: 1920x1080 (Full HD) or 3840x2160 (4K)
- **Frame Rate**: 30fps or 60fps
- **Duration**: 30-60 seconds (for seamless loop)
- **Format**: MP4 (H.264 codec) + WebM (VP9 codec)
- **File Size**: < 10MB for optimal loading

### Video Content Suggestions
- **Space Nebula**: Colorful cosmic clouds and gas formations
- **Star Field**: Moving stars and constellations
- **Galaxy Rotation**: Spiral galaxy with cosmic dust
- **Particle Effects**: Floating cosmic particles and energy
- **Deep Space**: Dark space with distant stars and galaxies

### Video Sources
1. **NASA Videos**: Free high-quality space footage
2. **Pexels Videos**: Free cosmic and space videos
3. **Unsplash Videos**: Professional space animations
4. **Custom Creation**: Use After Effects, Blender, or similar tools

## 🎵 Audio Requirements

### Recommended Audio Specifications
- **Format**: MP3 (320kbps) + OGG (for better compression)
- **Duration**: 30-60 seconds (for seamless loop)
- **Sample Rate**: 44.1kHz
- **Channels**: Stereo
- **File Size**: < 2MB for optimal loading

### Audio Content Suggestions
- **Ambient Space Sounds**: Deep space hum and cosmic wind
- **Big Bang Effects**: Cosmic explosion and energy sounds
- **Nebula Ambience**: Ethereal and mystical space sounds
- **Particle Sounds**: Subtle cosmic particle effects
- **Orbital Mechanics**: Space station or satellite sounds

### Audio Sources
1. **Freesound.org**: Free cosmic and space audio
2. **Zapsplat**: Professional space sound effects
3. **Adobe Stock**: High-quality cosmic audio
4. **Custom Creation**: Use Audacity, Logic Pro, or similar tools

## 🚀 Implementation Steps

### 1. Add Video Files
```bash
# Place your video files in the public directory
frontend/public/cosmic-space.mp4      # Main video file
frontend/public/cosmic-space.webm     # WebM version for better compression
```

### 2. Add Audio Files
```bash
# Place your audio files in the public directory
frontend/public/cosmic-space-audio.mp3 # Main audio file
frontend/public/cosmic-space-audio.ogg # OGG version for better compression
```

### 3. Test the Implementation
```bash
# Start the development server
npm run dev

# Open http://localhost:3000
# The cosmic video should auto-play with audio controls
```

## 🎨 Customization Options

### Video Controls
- **Auto-play**: Video starts automatically
- **Loop**: Seamless continuous playback
- **Muted by default**: User can unmute with button
- **Fallback**: CSS animations if video fails to load

### Audio Controls
- **Mute/Unmute Button**: Top-right corner with cosmic styling
- **Auto-sync**: Audio syncs with video playback
- **Loop**: Continuous audio playback
- **Volume Control**: Can be added for advanced control

## 🔧 Technical Implementation

### Video Component Features
- **Responsive**: Scales to fit any screen size
- **Performance**: Optimized for smooth playback
- **Accessibility**: Proper ARIA labels and controls
- **Fallback**: CSS animations when video unavailable

### Audio Integration
- **Synchronized**: Audio plays with video
- **User Control**: Mute/unmute functionality
- **Looping**: Seamless audio loop
- **Error Handling**: Graceful fallback if audio fails

## 🌟 Recommended Cosmic Media

### Video Suggestions
1. **"Cosmic Nebula"** - Colorful space clouds
2. **"Star Field Journey"** - Moving through stars
3. **"Galaxy Rotation"** - Spiral galaxy animation
4. **"Deep Space"** - Dark space with distant objects
5. **"Particle Universe"** - Floating cosmic particles

### Audio Suggestions
1. **"Space Ambience"** - Deep space hum
2. **"Cosmic Wind"** - Ethereal space sounds
3. **"Nebula Resonance"** - Mystical cosmic tones
4. **"Orbital Mechanics"** - Space station sounds
5. **"Big Bang Echo"** - Cosmic explosion effects

## 🎯 Perplexity-Style Effect

The implementation mimics Perplexity's comet effect with:
- **Full-screen video background**
- **Ambient space audio**
- **Smooth animations and transitions**
- **Interactive controls**
- **Responsive design**
- **Performance optimization**

## 🔍 Testing Checklist

- [ ] Video loads and plays automatically
- [ ] Audio plays when unmuted
- [ ] Mute/unmute button works
- [ ] Video loops seamlessly
- [ ] Audio loops seamlessly
- [ ] Fallback animations work
- [ ] Responsive on mobile devices
- [ ] Performance is smooth
- [ ] No console errors
- [ ] Accessibility features work

## 🚀 Production Deployment

### Optimization Tips
1. **Compress videos** using HandBrake or similar tools
2. **Optimize audio** for web playback
3. **Use CDN** for faster loading
4. **Implement lazy loading** for better performance
5. **Add loading states** for better UX

### Browser Support
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Responsive design

---

**Ready to create an immersive cosmic experience!** 🌌✨
