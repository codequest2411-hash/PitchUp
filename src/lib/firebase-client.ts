"use client";
import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

// Config comes from the server at runtime (see firebaseWebConfig) so one Docker image works everywhere.
export const clientAuth = (config?: FirebaseOptions) => getAuth(getApps()[0] ?? initializeApp(config!));
