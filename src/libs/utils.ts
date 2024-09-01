/**
 * 从文本中提取JSON对象或数组并验证其有效性
 * @param text 包含可能的JSON的输入文本
 * @returns 包含提取的JSON和验证结果的对象
 */
export function extractAndValidateJSON(text: string): {
  extractedJSON: string | null;
  isValid: boolean;
} {
  // 匹配 JSON 对象或数组的正则表达式
  const jsonRegex =
    /(\{|\[)(?:(?=([^"]*"[^"]*")*[^"]*$)(?:[^{}[\]]|\{[^{}]*\}|\[[^\[\]]*\]))*(\}|\])/;
  const match = text.match(jsonRegex);

  if (!match) {
    return { extractedJSON: null, isValid: false };
  }

  const extractedJSON = match[0];

  try {
    JSON.parse(extractedJSON);
    return { extractedJSON, isValid: true };
  } catch (error) {
    return { extractedJSON, isValid: false };
  }
}
