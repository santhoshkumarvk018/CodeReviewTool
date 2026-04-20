import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const analyzeCode = async (codeContent, fileName, language) => {
  try {
    const response = await api.post("/analyze/", {
      code_content: codeContent,
      file_name: fileName,
      language: language,
    });
    return response.data;
  } catch (error) {
    console.error("Error analyzing code:", error);
    throw error;
  }
};

export const trainModel = async () => {
  try {
    const response = await api.post("/ml/train/");
    return response.data;
  } catch (error) {
    console.error("Error training model:", error);
    throw error;
  }
};

export const getMLStatus = async () => {
  try {
    const response = await api.get("/ml/status/");
    return response.data;
  } catch (error) {
    console.error("Error fetching ML status:", error);
    return { trained: false };
  }
};


export const getAnalysis = async (id) => {
  try {
    const response = await api.get(`/analyze/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching analysis:", error);
    throw error;
  }
};

export const getHistory = async () => {
  try {
    const response = await api.get("/history/");
    return response.data;
  } catch (error) {
    console.error("Error fetching history:", error);
    throw error;
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post("/auth/register/", {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/auth/login/", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export default api;
