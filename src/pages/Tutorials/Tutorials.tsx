/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react";
import PageMeta from "../../utils/common/PageMeta";
import PageBreadcrumb from "../../utils/common/PageBreadCrumb";
import {
  Search as SearchIcon,
  Mic as MicIcon,
  Star as StarIcon,
} from "lucide-react";
import Alert from "../../utils/ui/alert/Alert";
import AiTutorialDialog from "../../components/Tutorials/AiTutorialDialog";
import Button from "../../utils/ui/button/Button";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  rating: number;
  transcript?: string;
  isAIGenerated?: boolean;
}

interface AlertState {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

function Tutorials() {
  const defaultTutorials = useMemo<Tutorial[]>(
    () => [
      {
        id: "1",
        title: "Getting Started with LucoSMS",
        description:
          "Learn the basics of LucoSMS and how to send your first message.",
        videoUrl: "https://files.catbox.moe/qslr87.mp4",
        thumbnail: "/images/grid-image/image-04.png",
        rating: 0,
        isAIGenerated: false,
      },
      {
        id: "2",
        title: "Creating Message Templates",
        description:
          "Learn how to create and manage message templates for efficient communication.",
        videoUrl: "https://example.com/video2.mp4",
        thumbnail: "/images/chat/chat.jpg",
        rating: 0,
        isAIGenerated: false,
      },
      {
        id: "3",
        title: "API Integration Guide",
        description:
          "Step-by-step guide to integrating LucoSMS API into your applications.",
        videoUrl: "https://example.com/video3.mp4",
        thumbnail: "/images/grid-image/image-05.png",
        rating: 0,
        isAIGenerated: false,
      },
    ],
    []
  );

  const [tutorials, setTutorials] = useState<Tutorial[]>(defaultTutorials);

  const [filteredTutorials, setFilteredTutorials] = useState(tutorials);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(
    null
  );
  const [showTranscript, setShowTranscript] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [, setIsGeneratingVideo] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);


    useEffect(() => {
      if (alert) {
        const timer = setTimeout(() => {
          setAlert(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [alert]);
  // Load saved tutorials and ratings on initial mount
  useEffect(() => {
    const savedTutorials = localStorage.getItem("lucosms-tutorials");
    const savedRatings = localStorage.getItem("tutorialRatings");

    // Start with default tutorials
    let combinedTutorials = [...defaultTutorials];

    // Add saved tutorials if they exist
    if (savedTutorials) {
      const parsed = JSON.parse(savedTutorials);
      combinedTutorials = [...combinedTutorials, ...parsed];
    }

    // Apply ratings if they exist
    if (savedRatings) {
      const ratings = JSON.parse(savedRatings);
      combinedTutorials = combinedTutorials.map((tutorial) => ({
        ...tutorial,
        rating: ratings[tutorial.id] || tutorial.rating || 0,
      }));
    }

    setTutorials(combinedTutorials);
  }, [defaultTutorials]);

  // Update filtered tutorials when search query or tutorials change
  useEffect(() => {
    const filtered = tutorials.filter(
      (tutorial) =>
        tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTutorials(filtered);
  }, [searchQuery, tutorials]);

  const generateTranscript = async (tutorialId: string) => {
    try {
      const tutorial = tutorials.find((t) => t.id === tutorialId);
      if (!tutorial) return;

      const response = await fetch(
        `${import.meta.env.VITE_GEMINI_API_URL}?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a detailed transcript for a tutorial video titled "${tutorial.title}". The video covers the following description: "${tutorial.description}". Please provide a natural, conversational transcript that explains the concepts clearly.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate transcript");

      const data = await response.json();
      const generatedTranscript = data.candidates[0].content.parts[0].text;

      // Update the tutorial with the generated transcript
      const updatedTutorials = tutorials.map((t) =>
        t.id === tutorialId ? { ...t, transcript: generatedTranscript } : t
      );
      setTutorials(updatedTutorials);
      setIsGeneratingTranscript(false);
    } catch (error) {
      console.error("Error generating transcript:", error);
      setIsGeneratingTranscript(false);
      setAlert({
        variant: "error",
        title: "Transcript Generation Failed",
        message: "Failed to generate transcript. Please try again later.",
      });
    }
  };

  const handleGenerateNewTutorial = async (
    topic: string,
    subtopics: string
  ) => {
    setIsGeneratingVideo(true);
    setAlert({
      variant: "info",
      title: "Generating Tutorial",
      message: "Please wait while we generate your tutorial content...",
    });
    try {
      const apiKey = "AIzaSyBefEfnVTBw2BjHSoPgRx372NEuxh0irbM";
      const prompt = `Create a detailed tutorial for LucoSMS about ${topic}. The tutorial should cover: ${subtopics}. Format the response exactly as follows:
      # ${topic}
      A comprehensive guide to ${topic.toLowerCase()} in LucoSMS
      
      00:00 - Introduction
      - Overview of ${topic}
      - Why it's important

      05:00 - Key Concepts
      - Understanding the basics
      - Core components

      10:00 - Step-by-Step Guide
      - Detailed walkthrough
      - Best practices

      15:00 - Advanced Tips
      - Pro tips
      - Common pitfalls

      20:00 - Next Steps
      - Related features
      - Additional resources`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      console.log("API Response:", await response.clone().text()); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `Failed to generate tutorial content: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("API Response Data:", data);

      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }

      const content = data.candidates[0].content.parts[0].text;
      const lines = content.split("\n");

      // Create a new tutorial with properly formatted content
      const newTutorial: Tutorial = {
        id: Date.now().toString(),
        title:
          (lines[0] || "").replace("#", "").trim() || "New LucoSMS Tutorial",
        description:
          lines[1]?.trim() || "A comprehensive guide to using LucoSMS",
        videoUrl: "text-tutorial",
        thumbnail: "/images/grid-image/image-06.png",
        rating: 0,
        transcript: content,
        isAIGenerated: true, // Add this flag for AI-generated tutorials
      };

      // Save to localStorage
      const savedTutorials = JSON.parse(
        localStorage.getItem("lucosms-tutorials") || "[]"
      );
      const updatedTutorials = [...savedTutorials, newTutorial];
      localStorage.setItem(
        "lucosms-tutorials",
        JSON.stringify(updatedTutorials)
      );

      // Update state
      setTutorials((prev) => [...prev, newTutorial]);
      setAlert({
        variant: "success",
        title: "Tutorial Generated",
        message: "New tutorial has been generated and saved!",
      });
    } catch (error) {
      console.error("Error generating tutorial:", error);
      let errorMessage = "Failed to generate tutorial. Please try again.";

      if (error instanceof Error) {
        console.log("API Error:", error.message);
        if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage =
            "API authentication failed. Please check your API key.";
        } else if (error.message.includes("429")) {
          errorMessage = "Too many requests. Please try again in a moment.";
        }
      }
      setAlert({
        variant: "error",
        title: "Tutorial Generation Failed",
        message: errorMessage,
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDeleteTutorial = (tutorialId: string) => {
    // Filter out the tutorial to be deleted
    const updatedTutorials = tutorials.filter(
      (tutorial) => tutorial.id !== tutorialId
    );
    setTutorials(updatedTutorials);

    // Update localStorage
    const savedTutorials = JSON.parse(
      localStorage.getItem("lucosms-tutorials") || "[]"
    );
    const updatedSavedTutorials = savedTutorials.filter(
      (t: Tutorial) => t.id !== tutorialId
    );
    localStorage.setItem(
      "lucosms-tutorials",
      JSON.stringify(updatedSavedTutorials)
    );

    // Remove rating for the deleted tutorial
    const savedRatings = JSON.parse(
      localStorage.getItem("tutorialRatings") || "{}"
    );
    delete savedRatings[tutorialId];
    localStorage.setItem("tutorialRatings", JSON.stringify(savedRatings));

    setAlert({
      variant: "success",
      title: "Tutorial Deleted",
      message: "The tutorial has been successfully deleted.",
    });
  };

  const handleVoiceSearch = () => {
    if (!isListening) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        // Store recognition instance in ref to avoid recreation
        if (!recognitionRef.current) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true; // Keep listening
          recognition.interimResults = true; // Get real-time results
          recognition.lang = "en-US";
          recognitionRef.current = recognition;

          recognition.onstart = () => {
            setIsListening(true);
            setSearchQuery("");
            if (searchInputRef.current) {
              searchInputRef.current.value = "";
            }
          };

          recognition.onresult = (event: any) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = 0; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                finalTranscript += result[0].transcript;
              } else {
                interimTranscript += result[0].transcript;
              }
            }

            const currentTranscript = finalTranscript || interimTranscript;
            setSearchQuery(currentTranscript);
            if (searchInputRef.current) {
              searchInputRef.current.value = currentTranscript;
            }
          };

          recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };
        }

        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error("Error starting speech recognition:", error);
          setIsListening(false);
        }
      } else {
        setAlert({
          variant: "warning",
          title: "Browser Not Supported",
          message:
            "Speech recognition is not supported in this browser. Please use Chrome or Edge for this feature.",
        });
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
  };

  const handleRating = (tutorialId: string, rating: number) => {
    const updatedTutorials = tutorials.map((tutorial) =>
      tutorial.id === tutorialId ? { ...tutorial, rating } : tutorial
    );
    setTutorials(updatedTutorials);

    // Save ratings to localStorage
    const savedRatings = JSON.parse(
      localStorage.getItem("tutorialRatings") || "{}"
    );
    savedRatings[tutorialId] = rating;
    localStorage.setItem("tutorialRatings", JSON.stringify(savedRatings));
  };

  const generateAISuggestions = async (tutorialId: string) => {
    try {
      // Using the existing Gemini API integration as seen in Templates.tsx
      const response = await fetch(
        `${import.meta.env.VITE_GEMINI_API_URL}?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Based on the user watching tutorial "${
                      tutorials.find((t) => t.id === tutorialId)?.title
                    }", suggest 3 related tutorials or resources they might find helpful.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate suggestions");

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error generating suggestions:", error);
      setAlert({
        variant: "error",
        title: "Suggestions Failed",
        message: "Unable to generate suggestions at this time.",
      });
      return "";
    }
  };

  return (
    <>
      <PageMeta
        title="LucoSMS - Video Tutorials"
        description="Learn how to use LucoSMS with our comprehensive video tutorials"
      />
      <PageBreadcrumb pageTitle="Video Tutorials" />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Tutorial Videos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn how to use LucoSMS effectively
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowTopicDialog(true)}
              className="flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 3H4.5C3.67157 3 3 3.67157 3 4.5V8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 3H19.5C20.3284 3 21 3.67157 21 4.5V8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 21H19.5C20.3284 21 21 20.3284 21 19.5V16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 21H4.5C3.67157 21 3 20.3284 3 19.5V16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 8L12 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 12L8 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Generate Luco AI Tutorial
            </Button>
          </div>
          <div className="mb-6">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tutorials..."
                className="w-full pl-10 pr-12 py-2 border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <button
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 ${
                  isListening ? "text-red-500" : ""
                }`}
              >
                <MicIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                className={`rounded-lg border overflow-hidden transition-all  hover:shadow-lg ${
                  tutorial.isAIGenerated
                    ? "border-blue-200  dark:border-blue-800 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-300"
                }`}
              >
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                  <img
                    src={tutorial.thumbnail}
                    alt={tutorial.title}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant={tutorial.isAIGenerated ? "outline" : "primary"}
                    onClick={() => setSelectedTutorial(tutorial)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    {tutorial.isAIGenerated ? "Read Now" : "Watch Now"}
                  </Button>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-semibold dark:text-white line-clamp-1">
                        {tutorial.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {tutorial.description}
                      </p>
                    </div>
                    {tutorial.isAIGenerated && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(tutorial.id, star)}
                          className="focus:outline-none"
                        >
                          <StarIcon
                            className={`h-4 w-4 ${
                              star <= tutorial.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTutorial(tutorial);
                          setShowTranscript(true);
                        }}
                      >
                        {tutorial.isAIGenerated ? "Read" : "Transcript"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTutorial(tutorial.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Selection Dialog */}
      {showTopicDialog && (
        <AiTutorialDialog
          onTopicSelect={(topic, subtopics) => {
            setShowTopicDialog(false);
            handleGenerateNewTutorial(topic, subtopics);
          }}
          onClose={() => setShowTopicDialog(false)}
        />
      )}

      {/* Video Modal */}
      {selectedTutorial && !showTranscript && (
        <div className="fixed inset-0 z-90 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => {
              setSelectedTutorial(null);
              setSuggestions([]);
            }}
          />
          <div className="relative z-50  bg-white rounded-lg shadow-xl w-full max-w-4xl dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold dark:text-white">
                  {selectedTutorial.title}
                </h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTutorial(null);
                    setSuggestions([]);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="aspect-video">
              {selectedTutorial.videoUrl === "text-tutorial" ? (
                <div className="w-full h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
                  <div className="prose dark:prose-invert max-w-none">
                    {selectedTutorial.transcript
                      ?.split("\n")
                      .map((line, index) => {
                        // Check if line is a timestamp
                        if (line.match(/^\d{2}:\d{2}/)) {
                          return (
                            <div
                              key={index}
                              className="flex items-start gap-2 mb-4"
                            >
                              <span className="font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                {line.split(" ")[0]}
                              </span>
                              <p className="m-0">
                                {line.substring(line.indexOf(" ")).trim()}
                              </p>
                            </div>
                          );
                        }
                        // Check if line is a heading
                        if (line.startsWith("#")) {
                          return (
                            <h3 key={index} className="font-bold mt-6 mb-3">
                              {line.replace(/#/g, "").trim()}
                            </h3>
                          );
                        }
                        // Regular line
                        return (
                          line.trim() && (
                            <p key={index} className="mb-4">
                              {line}
                            </p>
                          )
                        );
                      })}
                  </div>
                </div>
              ) : (
                <video
                  src={selectedTutorial.videoUrl}
                  controls
                  className="w-full h-full"
                  autoPlay
                  onPlay={() => {
                    if (!selectedTutorial.transcript) {
                      setIsGeneratingTranscript(true);
                      generateTranscript(selectedTutorial.id);
                    }
                    setIsLoadingSuggestions(true);
                    generateAISuggestions(selectedTutorial.id).then((suggs) => {
                      setSuggestions(
                        suggs.split("\n").filter((s: string) => s.trim())
                      );
                      setIsLoadingSuggestions(false);
                    });
                  }}
                />
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold dark:text-white">
                  Suggested Next Steps
                </h4>
                {isLoadingSuggestions ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading suggestions...
                  </p>
                ) : suggestions.length > 0 ? (
                  <ul className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 dark:text-gray-300"
                      >
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {selectedTutorial && showTranscript && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => {
              setSelectedTutorial(null);
              setShowTranscript(false);
            }}
          />
          <div className="relative z-50 bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 dark:bg-gray-800 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold dark:text-white">
                  {selectedTutorial.isAIGenerated
                    ? "AI Tutorial"
                    : "Transcript"}{" "}
                  - {selectedTutorial.title}
                </h3>
                {selectedTutorial.isAIGenerated && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                    AI Generated
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTutorial(null);
                  setShowTranscript(false);
                }}
              >
                Close
              </Button>
            </div>
            <div className="prose dark:prose-invert max-h-96 overflow-y-auto p-4">
              {isGeneratingTranscript ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Generating transcript...
                  </p>
                </div>
              ) : selectedTutorial.transcript ? (
                <div className="space-y-4">
                  {selectedTutorial.transcript
                    .split("\n\n")
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-gray-700 dark:text-gray-300"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No transcript available. Click the generate button below to
                    create one.
                  </p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => {
                      setIsGeneratingTranscript(true);
                      generateTranscript(selectedTutorial.id);
                    }}
                  >
                    Generate Transcript
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Component */}
      {alert && (
        <div className="fixed top-0 right-4 z-50">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            showLink={false}
          />
        </div>
      )}
    </>
  );
}

export default Tutorials;
