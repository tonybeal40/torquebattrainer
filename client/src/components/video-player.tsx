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

  return (
    <div className={`bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video object-contain bg-black"
          playsInline
          data-testid="video-player"
        />
        
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-mono">
          Frame {currentFrame} / {totalFrames}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-16 font-mono">
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
          <span className="text-xs text-slate-400 w-16 text-right font-mono">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => stepFrame(-1)}
              className="border-slate-600 text-slate-300 px-2"
              data-testid="button-prev-frame"
            >
              ⏮ -1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="border-slate-600 text-slate-300 px-4"
              data-testid="button-play-pause"
            >
              {isPlaying ? "⏸" : "▶"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => stepFrame(1)}
              className="border-slate-600 text-slate-300 px-2"
              data-testid="button-next-frame"
            >
              +1 ⏭
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-1">Speed:</span>
            {[0.25, 0.5, 1].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "default" : "outline"}
                size="sm"
                onClick={() => changePlaybackRate(rate)}
                className={
                  playbackRate === rate
                    ? "bg-sky-600 text-white px-2"
                    : "border-slate-600 text-slate-300 px-2"
                }
                data-testid={`button-speed-${rate}`}
              >
                {rate === 1 ? "1x" : rate === 0.5 ? "½x" : "¼x"}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
