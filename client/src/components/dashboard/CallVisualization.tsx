import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Volume2, Pause } from "lucide-react";

export function CallVisualization() {
  const [callDuration, setCallDuration] = useState("00:00");
  const [isCallActive, setIsCallActive] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    // Generate random waveform data for visualization
    const interval = setInterval(() => {
      if (isCallActive) {
        const newData = Array.from({ length: 8 }, () => Math.random() * 100);
        setWaveformData(newData);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isCallActive]);

  useEffect(() => {
    // Call duration timer
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      let seconds = 0;
      interval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setCallDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isCallActive]);

  // Mock call activation for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCallActive(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="glassmorphic border-white/10 p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Active Call Status</h3>
      
      <div className="text-center mb-6">
        <img
          src="https://images.unsplash.com/photo-1494790108755-2616b612b5b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
          alt="Call participant"
          className={`w-24 h-24 rounded-full mx-auto object-cover border-4 border-accent-cyan mb-4 ${
            isCallActive ? "animate-pulse-slow" : ""
          }`}
        />
        <h4 className="text-lg font-semibold text-white">Sarah Martinez</h4>
        <p className="text-text-muted">+1 (555) 987-6543</p>
        <p className="text-accent-green text-sm font-medium mt-2">{callDuration}</p>
      </div>

      {/* Waveform Visualization */}
      <div className="flex items-center justify-center space-x-1 mb-6 h-16">
        {waveformData.map((height, index) => (
          <div
            key={index}
            className="w-1 bg-accent-cyan rounded-full transition-all duration-150 ease-out"
            style={{
              height: `${Math.max(height, 20)}%`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full"
        >
          <Mic className="h-5 w-5 text-accent-cyan" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full"
        >
          <Volume2 className="h-5 w-5 text-accent-cyan" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full"
        >
          <Pause className="h-5 w-5 text-accent-cyan" />
        </Button>
      </div>
    </Card>
  );
}
