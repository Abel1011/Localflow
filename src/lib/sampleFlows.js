export const sampleFlows = [
  {
    "name": "Automated CV Review for Frontend Developer",
    "description": "Automated CV Review for Frontend Developer",
    "nodes": [
      {
        "id": "2",
        "type": "pdfInput",
        "position": {
          "x": 238.61118250547352,
          "y": 496.5153640160496
        },
        "width": 320,
        "height": 278,
        "selected": false,
        "dragging": false,
        "data": {
          "label": "PdfInput",
          "name": "CV"
        }
      },
      {
        "id": "3",
        "type": "prompt",
        "position": {
          "x": 755.330706964528,
          "y": 391.3149589350361
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 755.330706964528,
          "y": 391.3149589350361
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Extract Name",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "From the following resume text:\n\n{{CV}}\n\nExtract only the candidate's full name.  Do not include any other text, greeting, or explanation.  \nRespond with the exact name only."
        }
      },
      {
        "id": "4",
        "type": "prompt",
        "position": {
          "x": 823.1193854269882,
          "y": 727.0162613286476
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 823.1193854269882,
          "y": 727.0162613286476
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Extract Email",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "From the following resume text:\n\n{{CV}}\n\nExtract only the candidate's email address. \n\nDo not include any explanation, greeting, or formatting — output the raw email only."
        }
      },
      {
        "id": "5",
        "type": "summarizer",
        "position": {
          "x": 830.243070259989,
          "y": 1060.4309060217115
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 830.243070259989,
          "y": 1060.4309060217115
        },
        "dragging": false,
        "data": {
          "label": "Summarizer",
          "name": "Summarize Resume",
          "type": "key-points",
          "context": "{{CV}}"
        }
      },
      {
        "id": "6",
        "type": "prompt",
        "position": {
          "x": 849.4840853271462,
          "y": 1456.3134835557603
        },
        "width": 320,
        "height": 296,
        "selected": false,
        "positionAbsolute": {
          "x": 849.4840853271462,
          "y": 1456.3134835557603
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Analyze Fit for Frontend Developer",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "Evaluate this resume for the position of Frontend Developer.:\n\n{{CV}}\n \nThe ideal candidate should meet the following requirements:\n- Strong proficiency in React and TypeScript  \n- Experience with modern frontend tools (Vite, Next.js, or similar)  \n- Good understanding of REST APIs and JSON data handling  \n- Ability to write clean, maintainable code  \n- Knowledge of responsive design and accessibility  \n- Familiarity with Git and team collaboration workflows  \n\nProvide only:\n1. A score from 1 to 10 based on fit.  \n2. Three main strengths.  \n3. Three areas for improvement.  \n\nDo not include any greetings or commentary outside these points."
        }
      },
      {
        "id": "7",
        "type": "prompt",
        "position": {
          "x": 1378.3012163290668,
          "y": 492.5178728330297
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 1378.3012163290668,
          "y": 492.5178728330297
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Generate Feedback Email",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "Write a professional email to the candidate named {{Extract Name}} using the following feedback on his/her CV data in the selection process  for Frontend Developer:\n\n{{Analyze Fit for Frontend Developer}}\n\nTone: professional, concise, encouraging."
        }
      }
    ],
    "edges": [
      {
        "source": "2",
        "sourceHandle": null,
        "target": "3",
        "targetHandle": null,
        "id": "reactflow__edge-2-3"
      },
      {
        "source": "2",
        "sourceHandle": null,
        "target": "4",
        "targetHandle": null,
        "id": "reactflow__edge-2-4"
      },
      {
        "source": "2",
        "sourceHandle": null,
        "target": "5",
        "targetHandle": null,
        "id": "reactflow__edge-2-5"
      },
      {
        "source": "2",
        "sourceHandle": null,
        "target": "6",
        "targetHandle": null,
        "id": "reactflow__edge-2-6"
      },
      {
        "source": "3",
        "sourceHandle": null,
        "target": "7",
        "targetHandle": null,
        "id": "reactflow__edge-3-7"
      },
      {
        "source": "6",
        "sourceHandle": null,
        "target": "7",
        "targetHandle": null,
        "id": "reactflow__edge-6-7"
      }
    ]
  },
  {
    "name": "English Writing Practice",
    "description": "English Writing Practice - A Day I'll Never Forget",
    "nodes": [
      {
        "id": "2",
        "type": "imageInput",
        "position": {
          "x": 61.495796349479065,
          "y": 393.6501513086118
        },
        "width": 320,
        "height": 250,
        "selected": false,
        "positionAbsolute": {
          "x": 61.495796349479065,
          "y": 393.6501513086118
        },
        "dragging": false,
        "data": {
          "label": "ImageInput",
          "name": "Image Essay"
        }
      },
      {
        "id": "3",
        "type": "prompt",
        "position": {
          "x": 520.3958298381001,
          "y": 387.4663012369963
        },
        "width": 320,
        "height": 398,
        "selected": false,
        "positionAbsolute": {
          "x": 520.3958298381001,
          "y": 387.4663012369963
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Transcribe Essay",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "selectedAttachments": [
            "Image Essay"
          ],
          "prompt": "Transcribe the text from the provided image exactly as it appears, including all words, punctuation, and line breaks. \nDo not correct spelling or grammar. \nReturn only the transcribed text with no extra commentary or greeting."
        }
      },
      {
        "id": "4",
        "type": "prompt",
        "position": {
          "x": 969.1640583677696,
          "y": 221.33763256835198
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 969.1640583677696,
          "y": 221.33763256835198
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Check Text Coherence",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "Analyze the following essay for coherence and logical flow:\n\n{{Transcribe Essay}}\n\nIdentify if the story has a clear beginning, middle, and end, and if ideas connect smoothly. \nReturn only:\n1) Coherence score from 1 to 10\n2) Short explanation (max 100 words) describing main coherence issues, if any\nDo not include greetings or any other text."
        }
      },
      {
        "id": "6",
        "type": "proofreader",
        "position": {
          "x": 993.9038581969198,
          "y": 757.017866545847
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 993.9038581969198,
          "y": 757.017866545847
        },
        "dragging": false,
        "data": {
          "label": "Proofreader",
          "name": "Proofread and Correct",
          "text": "{{Transcribe Essay}}"
        }
      },
      {
        "id": "7",
        "type": "prompt",
        "position": {
          "x": 1499.173300301517,
          "y": 447.6714465199493
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 1499.173300301517,
          "y": 447.6714465199493
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Feedback Generator",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "Using the following data:\n\n###\n- Original essay (before corrections):\n{{Transcribe Essay}}\n###\n\n###\n- Corrected essay (after proofreading):\n{{Proofread and Correct}}\n###\n\n###\n- Coherence evaluation (score and explanation):\n{{Check Text Coherence}}\n###\n\nWrite constructive feedback for the student focusing on:\n1) Coherence and narrative structure\n2) Grammar and punctuation\n3) Suggestions to improve storytelling\n\nKeep it concise (120–150 words), objective, and encouraging. \nDo not include any greetings, introductory phrases, or closing remarks."
        }
      },
      {
        "id": "8",
        "type": "translator",
        "position": {
          "x": 1924.5411187998948,
          "y": 443.20266722236494
        },
        "width": 320,
        "height": 296,
        "selected": false,
        "positionAbsolute": {
          "x": 1924.5411187998948,
          "y": 443.20266722236494
        },
        "dragging": false,
        "data": {
          "label": "Translator",
          "name": "Translate Feedback to Spanish",
          "text": "{{Feedback Generator}}"
        }
      }
    ],
    "edges": [
      {
        "source": "2",
        "sourceHandle": null,
        "target": "3",
        "targetHandle": null,
        "id": "reactflow__edge-2-3"
      },
      {
        "source": "3",
        "sourceHandle": null,
        "target": "4",
        "targetHandle": null,
        "id": "reactflow__edge-3-4"
      },
      {
        "source": "3",
        "sourceHandle": null,
        "target": "6",
        "targetHandle": null,
        "id": "reactflow__edge-3-6"
      },
      {
        "source": "4",
        "sourceHandle": null,
        "target": "7",
        "targetHandle": null,
        "id": "reactflow__edge-4-7"
      },
      {
        "source": "6",
        "sourceHandle": null,
        "target": "7",
        "targetHandle": null,
        "id": "reactflow__edge-6-7"
      },
      {
        "source": "3",
        "sourceHandle": null,
        "target": "7",
        "targetHandle": null,
        "id": "reactflow__edge-3-7"
      },
      {
        "source": "7",
        "sourceHandle": null,
        "target": "8",
        "targetHandle": null,
        "id": "reactflow__edge-7-8"
      }
    ]
  },
  {
    "name": "Customer Service Call Analysis",
    "description": "Customer Service Call Analysis",
    "nodes": [
      {
        "id": "2",
        "type": "audioInput",
        "position": {
          "x": 183.3635874397039,
          "y": 347.8218762686342
        },
        "width": 320,
        "height": 310,
        "selected": false,
        "positionAbsolute": {
          "x": 183.3635874397039,
          "y": 347.8218762686342
        },
        "dragging": false,
        "data": {
          "label": "AudioInput",
          "name": "Audio Input"
        }
      },
      {
        "id": "3",
        "type": "prompt",
        "position": {
          "x": 647.9897450957094,
          "y": 389.9295670340359
        },
        "width": 320,
        "height": 398,
        "selected": false,
        "positionAbsolute": {
          "x": 647.9897450957094,
          "y": 389.9295670340359
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Transcribe Call",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "selectedAttachments": [
            "Audio Input"
          ],
          "prompt": "Transcribe this audio recording accurately, including both the agent and the customer.\nUse the following format:\n\nAgent: ...\nCustomer: ...\nAgent: ...\nCustomer: ...\n\nDo not summarize, only transcribe exactly what is said.\nInclude emotional cues like [laughs], [sighs], [sarcastic], etc., if they are audible.\nReturn only the transcription, no commentary."
        }
      },
      {
        "id": "4",
        "type": "summarizer",
        "position": {
          "x": 1094.761083128211,
          "y": 438.41049568584765
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 1094.761083128211,
          "y": 438.41049568584765
        },
        "dragging": false,
        "data": {
          "label": "Summarizer",
          "name": "Summarize the Call",
          "type": "key-points",
          "sharedContext": "Summarize this customer service call briefly.\nInclude:\n- Reason for the call\n- Actions taken by the agent\n- Outcome\nKeep it under 150 words.",
          "context": "{{Transcribe Call}}"
        }
      },
      {
        "id": "5",
        "type": "prompt",
        "position": {
          "x": 1108.7761880233438,
          "y": 876.6236591902866
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 1108.7761880233438,
          "y": 876.6236591902866
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Analyze Interaction Quality",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "Analyze the following customer service call transcription:\n\n{{Transcribe Call}}\n\nReturn only:\n1) Agent politeness score (1–10)\n2) Agent communication clarity score (1–10)\n3) Customer satisfaction score (1–10)\n4) Tone summary (e.g. polite, frustrated, humorous)\n5) Three key insights (positive or negative)\n\nBase your analysis on tone, emotional cues, and dialogue quality.\nNo extra text or greetings."
        }
      },
      {
        "id": "6",
        "type": "prompt",
        "position": {
          "x": 1533.2575870931798,
          "y": 864.6556805825453
        },
        "width": 320,
        "height": 280,
        "selected": false,
        "positionAbsolute": {
          "x": 1533.2575870931798,
          "y": 864.6556805825453
        },
        "dragging": false,
        "data": {
          "label": "Prompt",
          "name": "Feedback Report Generator",
          "imageAttachmentLimit": 1,
          "audioAttachmentLimit": 1,
          "prompt": "Generate a professional summary report of the call analysis for training purposes, based on this data:\n\n{{Analyze Interaction Quality}}\n\nInclude:\n- Agent name (if available)\n- Key interaction highlights\n- Improvement suggestions\n- Overall tone and sentiment summary\n\nKeep the tone neutral and analytical.\nNo greetings or closing remarks."
        }
      }
    ],
    "edges": [
      {
        "source": "2",
        "sourceHandle": null,
        "target": "3",
        "targetHandle": null,
        "id": "reactflow__edge-2-3"
      },
      {
        "source": "3",
        "sourceHandle": null,
        "target": "4",
        "targetHandle": null,
        "id": "reactflow__edge-3-4"
      },
      {
        "source": "3",
        "sourceHandle": null,
        "target": "5",
        "targetHandle": null,
        "id": "reactflow__edge-3-5"
      },
      {
        "source": "5",
        "sourceHandle": null,
        "target": "6",
        "targetHandle": null,
        "id": "reactflow__edge-5-6"
      }
    ]
  }
];
