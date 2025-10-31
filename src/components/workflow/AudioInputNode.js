'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Mic, RotateCcw, PlayCircle, Loader2, AlertCircle, Trash2, UploadCloud } from 'lucide-react';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

const toReadableSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function AudioInputNode({ id, data, selected }) {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const file = data?.file || null;

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [file]);

  const emitAction = useCallback((action) => {
    if (!data?.name || typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(
  new CustomEvent('flow-node-action', {
        detail: { nodeName: data.name, action }
      })
    );
  }, [data?.name]);

  const applyAudioFile = useCallback((selectedFile) => {
    if (!selectedFile) {
      return;
    }

    data.onChange?.(id, 'file', selectedFile);
    data.onChange?.(id, 'attachment', {
      kind: 'audio',
      name: selectedFile.name,
      size: selectedFile.size,
      mimeType: selectedFile.type,
      file: selectedFile,
    });
    data.onChange?.(id, 'text', '');
  }, [data, id]);

  const handleFileSelected = useCallback((event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith('audio/')) {
      setError('Only audio files are supported.');
      return;
    }

    if (selectedFile.size > MAX_AUDIO_BYTES) {
      setError('Audio must not exceed 5 MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      applyAudioFile(selectedFile);
    } catch (processingError) {
      console.error('Audio processing failed:', processingError);
      setError('Unable to load the selected audio file.');
    } finally {
      setIsProcessing(false);
    }
  }, [applyAudioFile]);

  const handleRemove = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    data.onChange?.(id, 'file', null);
    data.onChange?.(id, 'attachment', null);
    data.onChange?.(id, 'text', '');
    setError(null);
  }, [data, id]);

  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      stopMediaStream();
      setIsRecording(false);
    }
  }, [stopMediaStream]);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error('Recording error:', event.error);
        setError('Recording error occurred.');
        setIsRecording(false);
        stopRecording();
      };

      recorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const fileName = `recording-${Date.now()}.webm`;
          const recordedFile = new File([blob], fileName, { type: 'audio/webm' });
          applyAudioFile(recordedFile);
        }
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        stopMediaStream();
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (recordError) {
      console.error('Unable to access microphone:', recordError);
      setError('Unable to access microphone.');
      stopMediaStream();
      setIsRecording(false);
    }
  }, [applyAudioFile, isRecording, stopMediaStream]);

  useEffect(() => () => {
    stopRecording();
  }, [stopRecording]);

  const formattedSize = useMemo(() => (file ? toReadableSize(file.size) : null), [file]);

  return (
    <div
      className={`relative bg-white rounded-xl border-2 shadow-lg w-[320px] transition-all ${
        selected ? 'border-amber-500 ring-4 ring-amber-200' : 'border-amber-300'
      }`}
    >
      <div
        className="px-4 py-2 rounded-t-xl flex items-center justify-between text-white"
        style={{ backgroundColor: '#f59e0b' }}
      >
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" />
          <span className="text-sm font-bold">{data?.name || 'Audio Input'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => emitAction('rerun')}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Re-run node"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => emitAction('runFromHere')}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Run from this node"
          >
            <PlayCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelected}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isRecording}
          className={`w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 transition-all ${
            isProcessing || isRecording
              ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-wait'
              : 'border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50'
          }`}
        >
          <UploadCloud className="w-6 h-6" />
          <span className="text-sm font-semibold">Select audio</span>
          <span className="text-[11px] text-slate-500">MP3, WAV, or M4A up to 5 MB</span>
        </button>

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-sm font-semibold ${
            isRecording
              ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
              : 'border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50'
          }`}
        >
          <Mic className="w-4 h-4" />
          {isRecording ? 'Stop recording' : 'Record audio'}
        </button>

        {isRecording && (
          <div className="text-[11px] text-rose-600">Recording... speak clearly and tap stop when finished.</div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing audio...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {file && previewUrl && (
          <div className="space-y-2">
            <audio
              ref={audioRef}
              controls
              src={previewUrl}
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="truncate" title={file.name}>
                <p className="font-semibold">{file.name}</p>
                <p className="text-[11px] text-slate-500">{file.type || 'audio'} • {formattedSize}</p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-white rounded transition"
                title="Remove audio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!file && !isRecording && (
          <p className="text-[11px] text-slate-500">
            Upload a clip or record one. The audio file will be available to Prompt nodes as an attachment.
          </p>
        )}
      </div>

      {data?.executionError && (
        <div className="px-4 pb-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-rose-700 mb-1">Error:</p>
            <p className="text-xs text-rose-900 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
              {data.executionError}
            </p>
          </div>
        </div>
      )}

      {data?.executionResult && (
        <div className="px-4 pb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Output:</p>
            <p className="text-xs text-amber-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {data.executionResult}
            </p>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#f59e0b',
          width: 12,
          height: 12,
          borderRadius: '9999px',
          border: '2px solid #ffffff',
          right: -6,
        }}
      />
    </div>
  );
}
