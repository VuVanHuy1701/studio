
'use server';
/**
 * @fileOverview AI Flow for suggesting task descriptions based on titles.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskInputSchema = z.object({
  title: z.string().describe('The title of the task to expand upon.'),
  category: z.string().describe('The category of the task.'),
});
export type SuggestTaskInput = z.infer<typeof SuggestTaskInputSchema>;

const SuggestTaskOutputSchema = z.object({
  description: z.string().describe('A concise, professional description for the task.'),
  suggestedPriority: z.enum(['Low', 'Medium', 'High']).describe('A suggested priority level.'),
});
export type SuggestTaskOutput = z.infer<typeof SuggestTaskOutputSchema>;

export async function suggestTaskDetails(input: SuggestTaskInput): Promise<SuggestTaskOutput> {
  return suggestTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPrompt',
  input: {schema: SuggestTaskInputSchema},
  output: {schema: SuggestTaskOutputSchema},
  prompt: `You are an AI productivity assistant for "Task Compass".
Given the task title "{{{title}}}" in the category "{{{category}}}", suggest a professional and helpful description.
Keep it under 3 sentences. Also suggest a priority level based on typical business or personal urgency.`,
});

const suggestTaskFlow = ai.defineFlow(
  {
    name: 'suggestTaskFlow',
    inputSchema: SuggestTaskInputSchema,
    outputSchema: SuggestTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
