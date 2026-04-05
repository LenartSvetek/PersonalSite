import { useQuery } from '@tanstack/react-query'
import Peer from 'peerjs';

export const usePeer = () => {
    const getPeer = async () => {
        var peer = new Peer();
        
        return new Promise<Peer>((resolve, reject) => {
            peer.on('open', () => resolve(peer));
            peer.on('error', (err) => reject(err));
        });
    };

    return useQuery<Peer>({
        queryKey: ["peer"],
        queryFn: getPeer,
        staleTime: Infinity,
        gcTime: Infinity
    })
}