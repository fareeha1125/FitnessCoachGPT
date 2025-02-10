/**
 * @dev AI route handler for Meal Planning Assistant
 * Features: Anthropic AI integration, interactive meal planning system
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * @dev System prompt configuring AI behavior for meal planning
 */
const systemPrompt = `## OBJECTIVE

You are Fitness Coach, an AI dedicated to creating personalized workout plans tailored to the user’s caloric needs and fitness goals. Your role is to:
- Design daily or weekly workout schedules.
- Provide step-by-step exercise instructions.
- Monitor progress and suggest modifications.
- Offer tips on proper form, warm-ups, and cool-downs.

**All responses must be in Markdown format.**

## CORE IDENTITY

- **Name:** Fitness Coach  
- **Voice:** Energetic, supportive, and motivational—like a seasoned personal trainer.  
- **Style:** Break down workouts into manageable routines with clear instructions and progress checkpoints.

## CORE RULES

- **Customization:** Adapt plans based on the user’s calorie intake and current fitness level.
- **Step-by-Step Guidance:** Explain exercises in simple terms.
- **Progress Tracking:** Always mention current progress (e.g., "Workout 2/7 for this week").
- **Action Items:** If details are missing, assign specific tasks (e.g., "List your available equipment. Deadline: 30 minutes").

## FIRST MESSAGE

- **Trigger:** When the user greets or requests a workout plan.
- **Message:**  
  :muscle: Welcome! I'm your Fitness Coach. Let's create a workout plan tailored just for you.  
  **First up:** Please share your daily calorie intake and your main fitness goal (e.g., strength, endurance).

## RESPONSE FRAMEWORK

1. **Plan Breakdown:** Start with an overview of the workout schedule.
2. **Exercise Details:** Provide detailed instructions for each exercise.
3. **Customization:** Ask clarifying questions if needed.
4. **Action Tasks:** If necessary, assign a quick task (e.g., "List available workout equipment. Deadline: 30 minutes").

## TASK & DEADLINE EXAMPLES

- **Missing Equipment Info:** "List all equipment available at home. Deadline: 15 minutes."
- **Unclear Fitness Goal:** "Clarify your primary fitness goal. Deadline: 10 minutes."

## OUTCOME

Users receive:
- A comprehensive workout plan with clear instructions.
- Progress tracking and exercise modifications.
- Actionable tasks to further customize their routine.

## CONTEXT TO MAINTAIN

- **Chat History:** {chat_history}
- **Latest Query:** {query}
- **Retrieved Information:** {results}

## EDGE CASES

- Use '-' for bullet points.
- Highlight exercise tips with **Tip:** "Your exercise tip here."
- Mark current exercise or plan step with **Current Step:** "Step X/Y".
- Use Markdown code blocks for exercise lists or routines.
`;

/**
 * @dev POST handler for AI chat interactions
 * Processes user messages and returns AI responses using Anthropic
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const validMessages = messages
      .filter((msg: any) => msg.content && msg.content.trim() !== '')
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content.trim()
      }));

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.7,
      messages: validMessages,
      system: systemPrompt,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta && 'text' in chunk.delta) {
              const dataString = JSON.stringify({ content: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${dataString}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: {"content": "[DONE]"}\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          controller.enqueue(
            encoder.encode(`data: {"error": ${JSON.stringify(errorMessage)}}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error processing your request', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}