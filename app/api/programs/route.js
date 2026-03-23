import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/app/lib/dbConnect";
import UserProgram from "@/app/models/UserProgram";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Utility to get authenticated user
async function getUserId(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.id;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const programs = await UserProgram.find({ user_id: userId });

    return NextResponse.json({ success: true, programs }, { status: 200 });
  } catch (error) {
    console.error("GET Program Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { programId, action, data } = body;

    if (!programId || !action) {
      return NextResponse.json({ success: false, message: "programId and action are required" }, { status: 400 });
    }

    // Find or create the user program record
    let userProgram = await UserProgram.findOne({ user_id: userId, programId });
    if (!userProgram) {
      userProgram = new UserProgram({ user_id: userId, programId });
    }

    // Handle different actions
    if (action === "toggleActivity") {
      const { activityId, date } = data; // date format: YYYY-MM-DD
      const progress = userProgram.progress || {};
      const key = `${programId}-${date}`;
      const completedIds = progress[key] || [];

      if (completedIds.includes(activityId)) {
        progress[key] = completedIds.filter((id) => id !== activityId);
      } else {
        progress[key] = [...completedIds, activityId];
      }
      userProgram.progress = progress;
      userProgram.markModified("progress");
    } else if (action === "logMood") {
      const { mood, date } = data;
      const moodLogs = userProgram.moodLogs || [];
      moodLogs.push({ mood, date: date || new Date().toISOString() });
      userProgram.moodLogs = moodLogs;
      userProgram.markModified("moodLogs");
    } else if (action === "addWater") {
      const { amount, date } = data; // amount is total glasses, date format YYYY-MM-DD
      const waterIntake = userProgram.waterIntake || {};
      waterIntake[date] = amount;
      userProgram.waterIntake = waterIntake;
      userProgram.markModified("waterIntake");
    }

    await userProgram.save();

    return NextResponse.json({ success: true, userProgram }, { status: 200 });
  } catch (error) {
    console.error("POST Program Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
