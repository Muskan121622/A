import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "../../types/advisory";
import { PlayCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface VideoCardProps {
    video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer group overflow-hidden hover:shadow-xl transition-all border-2 border-green-900 shadow-md">
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg" />
                        </div>
                    </div>
                    <CardContent className="p-4 bg-black">
                        <h3 className="font-semibold text-base line-clamp-2 leading-tight text-white group-hover:text-green-400 transition-colors">
                            {video.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-2">{video.channelTitle}</p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
                <div className="aspect-video w-full">
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>
            </DialogContent>
        </Dialog>
    );
};
