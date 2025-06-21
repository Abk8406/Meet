import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BurgerService } from './burger.service';
import { RouterOutlet } from '@angular/router';
import { SearchPipe } from './search.pipe';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../Auth/auth.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import { AlertService } from './alert.service';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HostListener } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { environment } from '../../../environments/environment';



interface RoomMember {
  id: string;
  name: string;
  isSharing: boolean;
  joinedAt?: Date;
}

@Component({
  selector: 'app-add-to-cart',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SearchPipe, FormsModule, HttpClientModule, MatIconModule, MatToolbarModule, MatMenuModule, MatButtonModule, MatSidenavModule, MatListModule, MatCardModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatExpansionModule],
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.css'],
  providers: [BurgerService, AuthService, AlertService]
})
export class AddToCartComponent implements AfterViewInit {
  @ViewChild('roomInput', { static: false }) roomInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('screenPreview', { static: false }) screenPreviewRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatMessagesBox', { static: false }) chatMessagesBoxRef!: ElementRef<HTMLDivElement>;
  @ViewChild('localCameraPreview', { static: false }) localCameraPreviewRef!: ElementRef<HTMLVideoElement>;

  configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  // Reactive properties
  roomId: string = '';
  roomName: string = '';
  userName: string = '';
  isConnected: boolean = false;
  isInRoom: boolean = false;
  isSharing: boolean = false;
  roomMembers: RoomMember[] = [];
  memberCount: number = 0;

  peerConnection: any = null;
  localStream: MediaStream | null = null;
  screenStream: any;
  socket: any;
  currentSharingUser: any = null;
  isInitiator: boolean = false;
  remoteConnections: any = new Map();
  hasPendingOffer = false;
  pendingIceCandidates: any = [];
  peerConnections: { [key: string]: RTCPeerConnection } = {};

  // Chat properties
  messages: { senderId: string, senderName: string, text: string }[] = [];
  chatMessage: string = '';
  typingUsers: Set<string> = new Set();
  typingNames: string[] = [];
  private typingTimeout: any;

  // Camera/Mic state
  isCameraOn: boolean = false;
  isMicOn: boolean = false;
  localCameraStream: MediaStream | null = null;
  remoteCameraStreams: { [userId: string]: MediaStream } = {};

  isDesktop = window.innerWidth > 900;

  private baseURL = environment.baseURL;

  constructor(private http: HttpClient, private alert: AlertService) {}

  ngOnInit(): void {
    this.initializeSocket();
  }

  ngAfterViewInit(): void {
    // Only keep necessary ViewChild references
  }

  updateConnectionStatus(connected: boolean) {
    this.isConnected = connected;
  }

  async showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info') {
    await this.alert.show(message, type);
  }

  initializeSocket() {
    this.socket = io('http://localhost:5000', {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.updateConnectionStatus(true);
      this.showMessage('Connected to server', 'success');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.updateConnectionStatus(false);
      this.showMessage('Disconnected from server', 'error');
    });

    this.socket.on('connection-established', (data: any) => {
      console.log('Connection established:', data);
    });

    this.socket.on('user-joined', async (data: any) => {
      console.log('User joined:', data);
      if (data.roomId === this.roomId) {
        const newMember: RoomMember = {
          id: data.userId,
          name: data.userName || `User ${data.userId}`,
          isSharing: false
        };
        this.roomMembers.push(newMember);
        this.updateMemberCount();

        // If I am currently sharing, create a new offer for the user who just joined
        if (this.isSharing && this.localStream) {
          console.log(`I am sharing, creating offer for new user ${data.userId}`);
          await this.createAndSendOffer(data.userId, this.localStream);
        }
      }
    });

    this.socket.on('user-left', (data: any) => {
      console.log('User left:', data);
      if (data.roomId === this.roomId) {
        this.roomMembers = this.roomMembers.filter(member => member.id !== data.userId);
        if (this.peerConnections[data.userId]) {
          this.peerConnections[data.userId].close();
          delete this.peerConnections[data.userId];
        }
        this.updateMemberCount();
      }
    });

    this.socket.on('room-members', (members: any[]) => {
      console.log('Room members received:', members);
      this.roomMembers = members.map((m: any) => ({
        id: m.id,
        name: m.name || `User ${m.id}`,
        isSharing: m.isSharing || false
      }));
      this.updateMemberCount();
    });

    this.socket.on('user-started-sharing', (data: any) => {
      console.log('User started sharing:', data);
      if (data.userId !== this.socket.id && data.roomId === this.roomId) {
        // We don't need to create a peer connection here anymore,
        // it will be created upon receiving an offer.
        console.log(`User ${data.userId} started sharing. Waiting for offer.`);
        
        // Update member sharing status
        this.roomMembers = this.roomMembers.map(member => 
          member.id === data.userId ? { ...member, isSharing: true } : member
        );
      }
    });

    this.socket.on('user-stopped-sharing', (data: any) => {
      console.log('User stopped sharing:', data);
      if (data.roomId === this.roomId && this.peerConnections[data.userId]) {
        this.peerConnections[data.userId].close();
        delete this.peerConnections[data.userId];
        
        // Update member sharing status
        this.roomMembers = this.roomMembers.map(member => 
          member.id === data.userId ? { ...member, isSharing: false } : member
        );
      }
    });

    // WebRTC signaling handlers
    this.socket.on('offer', async (data: any) => {
      console.log('Received offer:', data);
      if (data.sender !== this.socket.id && data.roomId === this.roomId) {
        try {
          console.log('Creating peer connection for offer sender:', data.sender);
          const pc = this.createPeerConnection(data.sender);
          this.peerConnections[data.sender] = pc;

          console.log('Setting remote description');
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

          console.log('Creating answer');
          const answer = await pc.createAnswer();

          console.log('Setting local description');
          await pc.setLocalDescription(answer);

          console.log('Sending answer to:', data.sender);
          this.socket.emit('answer', {
            answer: answer,
            target: data.sender,
            roomId: this.roomId
          });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
    });

    this.socket.on('answer', async (data: any) => {
      console.log('Received answer:', data);
      if (data.sender !== this.socket.id && data.roomId === this.roomId && this.peerConnections[data.sender]) {
        try {
          console.log('Setting remote description from answer');
          await this.peerConnections[data.sender].setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('Remote description set successfully');
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    });

    this.socket.on('ice-candidate', async (data: any) => {
      console.log('Received ICE candidate:', data);
      if (data.sender !== this.socket.id && data.roomId === this.roomId && this.peerConnections[data.sender]) {
        try {
          console.log('Adding ICE candidate');
          await this.peerConnections[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('ICE candidate added successfully');
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Chat event listener
    this.socket.on('chat-message', (msg: any) => {
      this.messages.push(msg);
      setTimeout(() => this.scrollChatToBottom(), 50);
    });

    // Typing indicator listeners
    this.socket.on('typing', (data: any) => {
      if (data && data.userId !== this.socket.id) {
        this.typingUsers.add(data.userName);
        this.updateTypingNames();
      }
    });
    this.socket.on('stop-typing', (data: any) => {
      if (data && data.userId !== this.socket.id) {
        this.typingUsers.delete(data.userName);
        this.updateTypingNames();
      }
    });
  }

  updateMemberCount() {
    this.memberCount = this.roomMembers.length;
  }

  async joinRoom() {
    const newRoomId = this.roomInputRef?.nativeElement?.value.trim();
    const { value: userName } = await this.alert.input('Enter your name', 'Name');
    if (!newRoomId || !userName) {
      await this.alert.show('Missing Info', 'warning', 'Missing Info');
      return;
    }
    
    this.userName = userName;
    this.joinRoomApi(newRoomId, userName).subscribe({
      next: async (res) => {
        this.roomId = newRoomId;
        this.isInRoom = true;
        // The server will now orchestrate member list updates
        this.socket.emit('join-room', { roomId: this.roomId, userName: this.userName });
        await this.alert.show('Joined Room', 'success', `You joined room: ${newRoomId}`);
      },
      error: async (err) => {
        await this.alert.show('Failed to join room', 'error', 'Failed to join room');
      }
    });
  }
  
  async createAndSendOffer(targetId: string, stream: MediaStream) {
    try {
      console.log('Creating peer connection for member:', targetId);
      const pc = this.createPeerConnection(targetId);
      this.peerConnections[targetId] = pc;
  
      // Add local stream to peer connection
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        console.log('Adding track to peer connection:', track.kind);
        pc.addTrack(track, stream);
      });
  
      // Create and send offer
      console.log('Creating offer for member:', targetId);
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false
      });
      console.log('Setting local description for member:', targetId);
      await pc.setLocalDescription(offer);
      console.log('Sending offer to member:', targetId);
      this.socket.emit('offer', {
        offer: offer,
        target: targetId,
        roomId: this.roomId
      });
    } catch (error) {
      console.error('Error creating/sending offer for member:', targetId, error);
    }
  }

  async startSharing() {
    if (this.isMobileDevice() && !(navigator.mediaDevices as any).getDisplayMedia) {
      await this.alert.show('Not Supported', 'error', 'Not Supported');
      return;
    }
    try {
      console.log('Starting screen sharing...');
      if (!this.roomId) {
        await this.alert.show('Missing Room ID', 'warning', 'Missing Room ID');
        return;
      }

      // Request screen sharing with specific constraints
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      if (!stream) {
        throw new Error('Failed to get screen sharing stream');
      }

      this.localStream = stream;
      this.isSharing = true;

      // Set up local preview
      const screenPreview = this.screenPreviewRef?.nativeElement;
      if (screenPreview) {
        (screenPreview as HTMLVideoElement).srcObject = stream;
        await (screenPreview as HTMLVideoElement).play().catch((error: any) => {
          console.error('Error playing local preview:', error);
        });
      }
      
      // Notify server that I am sharing
      this.socket.emit('start-sharing', { roomId: this.roomId });

      // Send offers to all room members except self
      const otherMembers = this.roomMembers.filter(member => member.id !== this.socket.id);
      console.log('Sending offer to room members:', otherMembers);

      for (const member of otherMembers) {
        await this.createAndSendOffer(member.id, stream);
      }

      // Update current user's sharing status in the UI
      this.roomMembers = this.roomMembers.map(member => 
        member.id === this.socket.id ? { ...member, isSharing: true } : member
      );

      // Handle stream ended
      stream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing ended by user');
        this.stopSharing();
      };
    } catch (error: any) {
      console.error('Error starting screen sharing:', error);
      await this.alert.show('Error', 'error', 'Error starting screen sharing');
      // Clean up on error
      if (this.localStream) {
        this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        this.localStream = null;
      }
      this.isSharing = false;
    }
  }

  createPeerConnection(userId: string): RTCPeerConnection {
    console.log('Creating new peer connection for user:', userId);
    const pc = new RTCPeerConnection({
      iceServers: this.configuration.iceServers,
      iceCandidatePoolSize: 10
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate for user:', userId);
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          target: userId,
          roomId: this.roomId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      const remoteVideos = document.getElementById('remoteVideos');
      if (!remoteVideos) {
        console.error('Remote videos container not found');
        return;
      }
      let videoElement = document.getElementById(`remote-video-${userId}`) as HTMLVideoElement | null;
      let container = document.getElementById(`remote-container-${userId}`);
      
      if (!videoElement) {
        console.log('Creating new video element for user:', userId);
        container = document.createElement('div');
        container.className = 'remote-video-container';
        container.id = `remote-container-${userId}`;
        
        // Add sharing highlight if this user is sharing
        const member = this.roomMembers.find(m => m.id === userId);
        if (member && member.isSharing) {
          container.classList.add('sharing');
        }
        
        const nameElement = document.createElement('h4');
        nameElement.textContent = member ? member.name : `User ${userId}`;
        
        videoElement = document.createElement('video');
        videoElement.id = `remote-video-${userId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.style.width = '100%';
        
        // Fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.title = 'Fullscreen';
        fullscreenBtn.innerHTML = '🔲';
        fullscreenBtn.onclick = () => {
          if (videoElement && videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
          } else if (videoElement && (videoElement as any).webkitRequestFullscreen) {
            (videoElement as any).webkitRequestFullscreen();
          } else if (videoElement && (videoElement as any).msRequestFullscreen) {
            (videoElement as any).msRequestFullscreen();
          }
        };
        
        container.appendChild(nameElement);
        container.appendChild(videoElement);
        container.appendChild(fullscreenBtn);
        remoteVideos.appendChild(container);
      } else if (container) {
        // Update sharing highlight if needed
        const member = this.roomMembers.find(m => m.id === userId);
        if (member && member.isSharing) {
          container.classList.add('sharing');
        } else {
          container.classList.remove('sharing');
        }
      }
      if (event.streams && event.streams[0]) {
        console.log('Setting video source from stream');
        if (videoElement) {
          videoElement.srcObject = event.streams[0];
        }
      } else {
        console.log('Creating new MediaStream with track');
        const stream = new MediaStream();
        stream.addTrack(event.track);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }
      if (videoElement) {
        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
        });
      }

      // Handle remote camera/audio
      if (event.track.kind === 'video' && event.track.label !== 'screen') {
        // Camera video
        let remoteCameras = document.getElementById('remoteCameras');
        if (!remoteCameras) return;
        let cameraContainer = document.getElementById(`remote-camera-container-${userId}`);
        let cameraVideo = document.getElementById(`remote-camera-video-${userId}`) as HTMLVideoElement | null;
        if (!cameraVideo) {
          cameraContainer = document.createElement('div');
          cameraContainer.className = 'remote-video-container';
          cameraContainer.id = `remote-camera-container-${userId}`;
          const nameElement = document.createElement('h4');
          const member = this.roomMembers.find(m => m.id === userId);
          nameElement.textContent = member ? member.name + ' (Camera)' : `User ${userId} (Camera)`;
          cameraVideo = document.createElement('video');
          cameraVideo.id = `remote-camera-video-${userId}`;
          cameraVideo.autoplay = true;
          cameraVideo.playsInline = true;
          cameraVideo.style.width = '100%';
          cameraContainer.appendChild(nameElement);
          cameraContainer.appendChild(cameraVideo);
          remoteCameras.appendChild(cameraContainer);
        }
        // Attach stream
        if (event.streams && event.streams[0]) {
          cameraVideo.srcObject = event.streams[0];
        } else {
          const stream = new MediaStream();
          stream.addTrack(event.track);
          cameraVideo.srcObject = stream;
        }
        cameraVideo.play().catch(() => {});
      }
      if (event.track.kind === 'audio') {
        // Audio: create (or reuse) an <audio> element for this user
        let audioId = `remote-audio-${userId}`;
        let audioEl = document.getElementById(audioId) as HTMLAudioElement | null;
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.id = audioId;
          audioEl.autoplay = true;
          audioEl.controls = false;
          document.body.appendChild(audioEl);
        }
        if (event.streams && event.streams[0]) {
          audioEl.srcObject = event.streams[0];
        } else {
          const stream = new MediaStream();
          stream.addTrack(event.track);
          audioEl.srcObject = stream;
        }
        audioEl.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('Connection established with:', userId);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        console.log('Connection lost with:', userId);
        const container = document.getElementById(`remote-container-${userId}`);
        if (container) {
          container.remove();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${userId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.log('ICE connection failed, attempting to restart ICE');
        pc.restartIce();
      }
    };

    return pc;
  }

  stopSharing() {
    console.log('Stopping screen sharing...');
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      this.localStream = null;
    }
    if (this.screenPreviewRef) {
      this.screenPreviewRef.nativeElement.srcObject = null;
    }
    this.isSharing = false;
    
    // Update current user's sharing status
    this.roomMembers = this.roomMembers.map(member => 
      member.id === this.socket.id ? { ...member, isSharing: false } : member
    );
    
    Object.entries(this.peerConnections).forEach(([userId, pc]) => {
      console.log('Closing peer connection for user:', userId);
      pc.close();
    });
    this.peerConnections = {};
    const remoteVideos = document.getElementById('remoteVideos');
    if (remoteVideos) {
      remoteVideos.innerHTML = '';
    }
    this.socket.emit('stop-sharing', { roomId: this.roomId });
  }

  isMobileDevice(): boolean {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  createRoom(roomName: string) {
    return this.http.post<{ roomId: string, roomName: string }>(`${this.baseURL}/rooms/create`, { roomName });
  }

  joinRoomApi(roomId: string, userName: string) {
    return this.http.post<{ message: string }>(`${this.baseURL}/rooms/join`, { roomId, userName });
  }

  async createRoomFromUI() {
    const { value: roomName, isConfirmed } = await this.alert.confirmInput('Enter a room name:', 'Create Room');
    if (!isConfirmed || !roomName) return;
    this.createRoom(roomName).subscribe({
      next: async (res) => {
        this.roomName = roomName;
        await this.alert.show('Room Created!', 'success', `Room created! ID: ${res.roomId}`);
        if (this.roomInputRef) {
          this.roomInputRef.nativeElement.value = res.roomId;
        }
        this.joinRoom();
      },
      error: async (err) => {
        await this.alert.show('Failed to create room', 'error', 'Failed to create room');
      }
    });
  }

  onChatInput() {
    if (!this.isInRoom) return;
    this.socket.emit('typing', { roomId: this.roomId, userName: this.userName });
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('stop-typing', { roomId: this.roomId, userName: this.userName });
    }, 1000);
  }

  sendMessage() {
    if (!this.chatMessage || !this.isInRoom) return;
    const msg = {
      senderId: this.socket.id,
      senderName: this.userName || 'Me',
      text: this.chatMessage.trim()
    };
    this.socket.emit('chat-message', { ...msg, roomId: this.roomId });
    this.messages.push(msg);
    this.chatMessage = '';
    setTimeout(() => this.scrollChatToBottom(), 50);
    // Stop typing indicator immediately after sending
    this.socket.emit('stop-typing', { roomId: this.roomId, userName: this.userName });
  }

  scrollChatToBottom() {
    if (this.chatMessagesBoxRef && this.chatMessagesBoxRef.nativeElement) {
      const el = this.chatMessagesBoxRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  updateTypingNames() {
    this.typingNames = Array.from(this.typingUsers);
  }

  async toggleCamera() {
    if (!this.isCameraOn) {
      // Turn on camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.localCameraStream = stream;
        this.isCameraOn = true;
        // Show local preview
        setTimeout(() => {
          if (this.localCameraPreviewRef && this.localCameraPreviewRef.nativeElement) {
            this.localCameraPreviewRef.nativeElement.srcObject = stream;
          }
        }, 0);
        // Add video track to all peer connections
        Object.values(this.peerConnections).forEach(pc => {
          stream.getVideoTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        });
      } catch (err) {
        this.isCameraOn = false;
        alert('Could not access camera.');
      }
    } else {
      // Turn off camera
      if (this.localCameraStream) {
        this.localCameraStream.getTracks().forEach(track => track.stop());
        this.localCameraStream = null;
      }
      this.isCameraOn = false;
      // Remove local preview
      if (this.localCameraPreviewRef && this.localCameraPreviewRef.nativeElement) {
        this.localCameraPreviewRef.nativeElement.srcObject = null;
      }
      // Remove video tracks from peer connections
      Object.values(this.peerConnections).forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            sender.replaceTrack(null);
          }
        });
      });
    }
  }

  async toggleMic() {
    if (!this.isMicOn) {
      // Turn on mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        this.isMicOn = true;
        // Add audio track to all peer connections
        Object.values(this.peerConnections).forEach(pc => {
          stream.getAudioTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        });
      } catch (err) {
        this.isMicOn = false;
        alert('Could not access microphone.');
      }
    } else {
      // Turn off mic
      this.isMicOn = false;
      // Remove audio tracks from peer connections
      Object.values(this.peerConnections).forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.replaceTrack(null);
          }
        });
      });
    }
  }

  leaveRoom() {
    // Implementation of leaveRoom method
  }

  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth > 900;
  }
}
