import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameRate = 30;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setCurrentFrame(Math.floor(video.currentTime * frameRate));
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Video play error:", error);
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const stepFrame = (direction: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);

    const frameTime = 1 / frameRate;
    const newTime = Math.max(0, Math.min(duration, video.currentTime + direction * frameTime));
    video.currentTime = newTime;
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const totalFrames = Math.floor(duration * frameRate);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-slate-950/80 rounded-xl overflow-hidden border border-slate-700/30 backdrop-blur-sm ${className}`}>
      <div className="relative group">
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video object-contain bg-black/80"
          playsInline
          data-testid="video-player"
        />
        
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] text-cyan-400 font-mono border border-cyan-500/20">
          {formatTime(currentTime)}
        </div>
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] text-emerald-400 font-mono border border-emerald-500/20">
          F{currentFrame}/{totalFrames}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-100"
            style={{ 
              width: `${progress}%`,
              boxShadow: "0 0 8px rgba(6,182,212,0.5)"
            }}
          />
        </div>

        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          data-testid="button-video-overlay-play"
        >
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <span className="text-white text-xl ml-0.5">{isPlaying ? "⏸" : "▶"}</span>
          </div>
        </button>
      </div>

      <div className="p-3 space-y-3 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-400 w-14 font-mono">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.001}
            onValueChange={handleSeek}
            className="flex-1"
            data-testid="slider-seek"
          />
          <span className="text-[10px] text-slate-500 w-14 text-right font-mono">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => stepFrame(-1)}
              className="border-slate-700/50 text-cyan-300 px-2 h-7 text-[11px] hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all font-mono"
              data-testid="button-prev-frame"
            >
              ← -1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="border-slate-700/50 text-white px-4 h-7 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
              data-testid="button-play-pause"
            >
              {isPlaying ? "⏸" : "▶"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => stepFrame(1)}
              className="border-slate-700/50 text-cyan-300 px-2 h-7 text-[11px] hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all font-mono"
              data-testid="button-next-frame"
            >
              +1 →
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 mr-1 font-mono">SPD</span>
            {[0.25, 0.5, 1].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "default" : "outline"}
                size="sm"
                onClick={() => changePlaybackRate(rate)}
                className={`h-7 px-2 text-[11px] font-mono transition-all ${
                  playbackRate === rate
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white border-0 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    : "border-slate-700/50 text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                }`}
                data-testid={`button-speed-${rate}`}
              >
                {rate === 1 ? "1x" : rate === 0.5 ? ".5x" : ".25x"}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
