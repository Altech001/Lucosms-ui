/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import PageBreadcrumb from "../utils/common/PageBreadCrumb";
import PageMeta from "../utils/common/PageMeta";
import Button from "../utils/ui/button/Button";
import Alert from "../utils/ui/alert/Alert";
import TextArea from "../utils/form/input/TextArea";
import Input from "../utils/form/input/InputField";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";

interface Template {
  id: number;
  name: string;
  content: string;
  isFavorite: boolean;
}

interface AlertState {
  variant: "success" | "error";
  title: string;
  message: string;
}

interface CachedData {
  templates: Template[];
  timestamp: number;
}

interface TemplateSuggestion {
  name: string;
  content: string;
  category: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [output, setOutput] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "favorite">("all");
  const [isCreating, setIsCreating] = useState<boolean>(false); // New state for loading spinner
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
  const [refreshingSuggestions, setRefreshingSuggestions] = useState(false);

  const navigate = useNavigate();
  const userId = 1; // Hardcoded for now; replace with dynamic user ID from auth context

  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  const getCachedTemplates = (): Template[] | null => {
    const cached = localStorage.getItem(`templates_${userId}`);
    if (!cached) return null;

    const { templates, timestamp }: CachedData = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(`templates_${userId}`);
      return null;
    }

    return templates;
  };

  const setCachedTemplates = (templates: Template[]) => {
    const cacheData: CachedData = {
      templates,
      timestamp: Date.now(),
    };
    localStorage.setItem(`templates_${userId}`, JSON.stringify(cacheData));
  };

  // Load templates and favorites on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    // Try to get cached templates first
    const cachedTemplates = getCachedTemplates();
    if (cachedTemplates) {
      setTemplates(cachedTemplates);
      return;
    }

    try {
      const response = await fetch(
        `https://luco-sms-api.onrender.com/api/v1/smstemplate?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error(`Failed to fetch templates: ${response.status}`);
      const data: { id: number; name: string; content: string }[] = await response.json();

      // Load favorite statuses from localStorage or cookies
      const favoriteStatuses = JSON.parse(localStorage.getItem(`favorites_${userId}`) || "{}");
      const templatesWithFavorites = data.map((template) => ({
        ...template,
        isFavorite: favoriteStatuses[template.id] ?? (Cookies.get(`favorite_${userId}_${template.id}`) === "true" || false),
      }));

      setTemplates(templatesWithFavorites);
      // Cache the templates
      setCachedTemplates(templatesWithFavorites);
    } catch (error) {
      console.error("Fetch templates error:", error);
      setAlert({
        variant: "error",
        title: "Error",
        message: "Failed to fetch templates. Please try again.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const saveFavoriteStatus = (templateId: number, isFavorite: boolean) => {
    // Update localStorage
    const favoriteStatuses = JSON.parse(localStorage.getItem(`favorites_${userId}`) || "{}");
    favoriteStatuses[templateId] = isFavorite;
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favoriteStatuses));

    // Update cookies (expires in 30 days)
    Cookies.set(`favorite_${userId}_${templateId}`, isFavorite.toString(), { expires: 30 });
  };

  const handleToggleFavorite = (index: number) => {
    const updatedTemplates = [...templates];
    updatedTemplates[index].isFavorite = !updatedTemplates[index].isFavorite;
    setTemplates(updatedTemplates);
    saveFavoriteStatus(updatedTemplates[index].id, updatedTemplates[index].isFavorite);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      (activeTab === "all" || (activeTab === "favorite" && template.isFavorite)) &&
      (searchQuery === "" ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTemplateClick = (template: Template) => {
    let content = template.content;
    if (content.includes("[name]")) {
      const name = prompt("Enter the name:");
      content = content.replace("[name]", name || "User");
    }
    navigate("/compose", { state: { selectedTemplate: { ...template, content } } });
  };

  const handleCreateTemplate = async () => {
    if (!formName || !formContent) {
      setAlert({
        variant: "error",
        title: "Validation Error",
        message: "Please fill in both name and content.",
      });
      return;
    }

    setIsCreating(true); // Start loading spinner
    try {
      const response = await fetch(
        `https://luco-sms-api.onrender.com/api/v1/smstemplate?user_id=${userId}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: 0, // Added to match SmsTemplates payload
            name: formName,
            content: formContent,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create template: ${response.status} - ${errorData.message || "Unknown error"}`);
      }

      const newTemplate: { id: number; name: string; content: string } = await response.json();
      const templateWithFavorite = { ...newTemplate, isFavorite: false };
      setTemplates([...templates, templateWithFavorite]);
      setCachedTemplates([...templates, templateWithFavorite]); // Update cache
      setAlert({
        variant: "success",
        title: "Success",
        message: "Template created successfully.",
      });
      setFormName("");
      setFormContent("");
      setIsModalOpen(false);
      saveFavoriteStatus(newTemplate.id, false);
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Create template error:", error);
      setAlert({
        variant: "error",
        title: "Error",
        message: `Failed to create template: ${error instanceof Error ? error.message : "Please try again."}`,
      });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsCreating(false); // Stop loading spinner
    }
  };

  const handleUpdateTemplate = async () => {
    if (editIndex === null || !formName || !formContent) {
      setAlert({
        variant: "error",
        title: "Validation Error",
        message: "Please fill in both name and content.",
      });
      return;
    }

    // const templateId = templates[editIndex].id;
    try {
      const response = await fetch(
        `https://luco-sms-api.onrender.com/api/v1/sms_temp_update?user_id=${userId}&new_content=${encodeURIComponent(formContent)}`,
        {
          method: "PUT",
          headers: {
            accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error(`Failed to update template: ${response.status}`);
      const updatedTemplates = [...templates];
      updatedTemplates[editIndex] = {
        ...updatedTemplates[editIndex],
        name: formName, // Note: API doesn't update name; adjust if API changes
        content: formContent,
      };
      setTemplates(updatedTemplates);
      setCachedTemplates(updatedTemplates); // Update cache
      setAlert({
        variant: "success",
        title: "Success",
        message: "Template updated successfully.",
      });
      setFormName("");
      setFormContent("");
      setEditIndex(null);
      setIsModalOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Update template error:", error);
      setAlert({
        variant: "error",
        title: "Error",
        message: "Failed to update template. Please try again.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDeleteTemplate = async (index: number) => {
    const templateId = templates[index].id;
    try  {
      const response = await fetch(
        `https://luco-sms-api.onrender.com/api/v1/sms_template?template_id=${templateId}&user_id=${userId}`,
        {
          method: "DELETE",
          headers: {
            accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error(`Failed to delete template: ${response.status}`);
      const updatedTemplates = templates.filter((_, i) => i !== index);
      setTemplates(updatedTemplates);
      setCachedTemplates(updatedTemplates); // Update cache
      setAlert({
        variant: "error",
        title: "Template Deleted",
        message: "The template has been successfully deleted.",
      });
      if (editIndex === index) {
        setFormName("");
        setFormContent("");
        setEditIndex(null);
      }
      // Remove favorite status from storage
      localStorage.removeItem(`favorites_${userId}`);
      Cookies.remove(`favorite_${userId}_${templateId}`);
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Delete template error:", error);
      setAlert({
        variant: "error",
        title: "Error",
        message: "Failed to delete template. Please try again.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEditClick = (index: number) => {
    setFormName(templates[index].name);
    setFormContent(templates[index].content);
    setEditIndex(index);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormName("");
    setFormContent("");
    setEditIndex(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditIndex(null);
    setFormName("");
    setFormContent("");
  };

  const GEMINI_API_KEY = "AIzaSyBefEfnVTBw2BjHSoPgRx372NEuxh0irbM";
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const generateSuggestionsWithAI = async () => {
    try {
      const prompt = `Generate 4 SMS template suggestions in JSON format. Each template should have: name (string), content (string, include [name] placeholder), and category (string). Categories can be: Marketing, Greeting, Reminder, Business, Event, or Celebration. Format as array of objects.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to generate suggestions');
      
      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response text
      const jsonMatch = generatedText.match(/\[.*\]/s);
      if (!jsonMatch) throw new Error('Invalid response format');
      
      const suggestions = JSON.parse(jsonMatch[0]);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to default suggestions if API fails
      setSuggestions([
        {
          name: "Welcome Message",
          content: "Hi [name], welcome to our service!",
          category: "Greeting"
        },
        // ...other default suggestions...
      ]);
    } finally {
      setRefreshingSuggestions(false);
    }
  };

  const refreshSuggestions = () => {
    setRefreshingSuggestions(true);
    generateSuggestionsWithAI();
  };

  useEffect(() => {
    generateSuggestionsWithAI();
  }, []);

  return (
    <>
      <PageMeta
        title="LucoSMS - Templates"
        description="Manage your message templates to save time and ensure consistency."
      />
      <PageBreadcrumb pageTitle="Templates" />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Message Templates</h2>
            {/* <span>View, Use ,Edit and Create Templates for Future Use</span> */}
            <Button variant="primary" onClick={openCreateModal}>
              Create Template
            </Button>
          </div>

          {alert && (
            <div className="mb-4">
              <Alert
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
                showLink={false}
              />
            </div>
          )}

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "all"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "favorite"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setActiveTab("favorite")}
                >
                  Favorites
                </button>
              </div>
            </div>

            {filteredTemplates.length === 0 ? (
              searchQuery ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No templates found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No templates yet</h3>
                  <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Create your first template to start saving time with quick messages.
                  </p>
                  <Button variant="primary" onClick={openCreateModal}>
                    Create Template
                  </Button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-[70%]">
                        {template.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleFavorite(index)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg
                            className={`w-5 h-5 ${
                              template.isFavorite
                                ? "text-yellow-400 fill-current"
                                : "text-gray-400"
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.163-7.334-3.854-7.334 3.854 1.4-8.163L.146 9.21l8.2-1.192L12 .587z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
                      {template.content}
                    </p>
                    <div className="flex justify-between mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateClick(template)}
                      >
                        Use
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDeleteTemplate(index)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {output && (
            <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Selected Template:
                </h4>
                <button
                  onClick={() => setOutput("")}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {output}
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {editIndex !== null ? "Edit Template" : "Create Template"}
              </h4>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <Input
                  type="text"
                  value={formName}
                  // value={}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Content
                </label>
                <TextArea
                  value={formContent}
                  onChange={(value) => setFormContent(value)}
                  rows={4}
                  placeholder="Enter template content. Use [name] for dynamic name insertion."
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tip: Use [name] to insert a name when using the template.
                </p>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Suggestions</h5>
                  <button
                    onClick={refreshSuggestions}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm flex items-center"
                    disabled={refreshingSuggestions}
                  >
                    <svg
                      className={`w-4 h-4 mr-1 ${refreshingSuggestions ? 'animate-spin' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setFormName(suggestion.name);
                        setFormContent(suggestion.content);
                      }}
                      className="p-2 text-left text-sm border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <span className="block font-medium text-gray-900 dark:text-white">{suggestion.name}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{suggestion.category}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={editIndex !== null ? handleUpdateTemplate : handleCreateTemplate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    editIndex !== null ? "Update" : "Create"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}