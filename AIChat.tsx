
import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { styles } from "./styles";
import { Student, Transaction, Employee, Account, AIChatMessage } from "./types";

export const AIChat = ({ students, transactions, employees, accounts, currentUser }: any) => {
    const [messages, setMessages] = useState<AIChatMessage[]>([
        { role: 'model', text: "Hello! I am your GIMS AI Analyst. I have access to your current institute data. How can I help you today?", timestamp: Date.now() }
    ]);
    const [input