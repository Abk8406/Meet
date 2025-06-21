import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { io } from 'socket.io-client'

interface SignalData {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  sender?: string;
  target?: string;
}

@Component({
  selector: 'app-screen-sharing',
  standalone: true,
  imports: [CommonModule,RouterOutlet,HttpClientModule],
  templateUrl: './screen-sharing.component.html',
  styleUrls: ['./screen-sharing.component.css']
})
export class ScreenSharingComponent implements OnInit {
  private socket: any;
  private peerConnection!: RTCPeerConnection;
  private localStream?: MediaStream;
  private remoteStream!: MediaStream;
  public canShareScreen: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeSocket();
    this.initializePeerConnection();
  }

  initializeSocket(): void {
    // Initialize Socket.IO connection
    this.socket = io(window.location.origin);

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('offer', async (data: SignalData) => {
      console.log('Received offer');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer!));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', { answer: answer, target: data.sender });
    });

    this.socket.on('answer', async (data: SignalData) => {
      console.log('Received answer');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer!));
    });

    this.socket.on('ice-candidate', async (data: SignalData) => {
      console.log('Received ICE candidate');
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate!));
    });

    this.socket.on('screenData', (data: any) => {
      const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
      if (remoteVideo) {
        remoteVideo.srcObject = data.stream;
      }
    });
  }

  initializePeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', { candidate: event.candidate, target: 'all' });
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received track');
      const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
      if (remoteVideo && event.streams && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };
  }

  async startScreenSharing(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (this.localStream) {
        const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = this.localStream;
        }
        this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream!));
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.socket.emit('offer', { offer: offer, target: 'all' });
      }
    } catch (error) {
      console.error('Error starting screen sharing:', error);
      alert('Failed to start screen sharing. Please check your permissions and try again.');
    }
  }

  stopScreenSharing(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.peerConnection.close();
      this.localStream = undefined; // Reset the localStream
    } else {
      console.error('No local stream to stop.');
    }
  }

  createRoom(): void {
    const roomName = (document.getElementById('roomName') as HTMLInputElement).value.trim();
    if (roomName) {
      this.http.post('http://localhost:5000/api/rooms/create', { roomName }).subscribe(
        (response: any) => {
          console.log(`Room '${roomName}' created with ID: ${response.roomId}`);
          this.socket.emit('createRoom', response.roomId);
          this.canShareScreen = false;
        },
        (error) => {
          console.error('Error creating room:', error);
        }
      );
    } else {
      console.error('Please enter a room name');
    }
  }

  joinRoom(): void {
    const roomName = (document.getElementById('roomName') as HTMLInputElement).value.trim();
    const userName = 'YourUserName'; // Replace with actual user name logic
    if (roomName) {
      this.http.post('http://localhost:5000/api/rooms/join', { roomId: roomName, userName }).subscribe(
        (response: any) => {
          console.log(`Joined room '${roomName}'`);
          this.socket.emit('joinRoom', roomName);
          this.canShareScreen = true;
        },
        (error) => {
          console.error('Error joining room:', error);
        }
      );
    } else {
      console.error('Please enter a room name');
    }
  }
} 