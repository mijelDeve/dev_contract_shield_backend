import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `Eres un asistente especializado en definir requerimientos de funcionalidades y pruebas unitarias para contratos de desarrollo de software. Tu personalidad es profesional, clara y metódica.

Tu objetivo es conversar con el usuario para entender:
1. Qué tipo de proyecto es (web, móvil, API, smart contract, etc.)
2. Qué funcionalidades principales tiene
3. Qué criterios de aceptación son importantes
4. Qué casos edge o errores deben cubrirse

Cuando tengas suficiente información, genera los requerimientos estructurados en DOS secciones:
- Requerimientos de Funcionalidades: qué debe hacer el software
- Requerimientos de Pruebas Unitarias: qué pruebas deben verificar el correcto funcionamiento

IMPORTANTE: Cuando determines que ya tienes suficientes requerimientos, responde con tu mensaje normal Y además incluye al final un bloque especial delimitado así:

---REQUIREMENTS_START---
## Requerimientos de Funcionalidades

1. [Funcionalidad 1]
2. [Funcionalidad 2]
...

## Requerimientos de Pruebas Unitarias

1. [Test 1: descripción de lo que verifica]
2. [Test 2: descripción de lo que verifica]
...
---REQUIREMENTS_END---

Si el usuario ya tiene una descripción en el contrato, revísala y genera requerimientos que la complementen sin repetir lo que ya está escrito.

Este bloque será parseado automáticamente para agregarlo al contrato. Solo incluye este bloque cuando tengas requerimientos completos y bien definidos. No lo incluyas en cada mensaje, solo cuando estés listo.`;

const REQUIREMENTS_START_DELIMITER = '---REQUIREMENTS_START---';
const REQUIREMENTS_END_DELIMITER = '---REQUIREMENTS_END---';

export interface ChatResponse {
  reply: string;
  requirements: string | null;
}

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async chat(
    message: string,
    history: Array<{ role: string; content: string }>,
    contractDescription?: string,
  ): Promise<ChatResponse> {
    const systemContent = contractDescription?.trim()
      ? `${SYSTEM_PROMPT}\n\nEl usuario ya tiene la siguiente descripción en el contrato:\n"""${contractDescription.trim()}"""\n\nUsa esta información como contexto para entender mejor el proyecto y generar requerimientos más relevantes.`
      : SYSTEM_PROMPT;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...history.map(
        (entry) =>
          ({
            role: entry.role as 'user' | 'assistant',
            content: entry.content,
          }) satisfies OpenAI.Chat.Completions.ChatCompletionMessageParam,
      ),
      { role: 'user', content: message },
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });

    const fullReply = completion.choices[0]?.message?.content ?? '';

    return this.parseResponse(fullReply);
  }

  private parseResponse(fullReply: string): ChatResponse {
    const startIndex = fullReply.indexOf(REQUIREMENTS_START_DELIMITER);
    const endIndex = fullReply.indexOf(REQUIREMENTS_END_DELIMITER);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return { reply: fullReply.trim(), requirements: null };
    }

    const requirements = fullReply
      .substring(startIndex + REQUIREMENTS_START_DELIMITER.length, endIndex)
      .trim();

    const reply = fullReply.substring(0, startIndex).trim();

    return {
      reply,
      requirements: requirements.length > 0 ? requirements : null,
    };
  }
}
