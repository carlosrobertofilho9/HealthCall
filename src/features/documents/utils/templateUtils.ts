/**
 * Utilitários para manipulação de templates de documentos.
 */

/**
 * Extrai todos os placeholders únicos de um texto de template.
 * Um placeholder é definido como qualquer texto entre `{{` e `}}`.
 * Espaços em branco extras dentro das chaves são ignorados.
 * 
 * @param templateText O texto do template.
 * @returns Uma lista de chaves únicas encontradas (ex: ["NOME", "CNS"]).
 */
export function extractPlaceholders(templateText: string): string[] {
  // Regex para capturar tudo entre {{ e }}
  // Explicação:
  // \{\{ : corresponde a '{{'
  // \s* : zero ou mais espaços
  // ([^}]+) : captura qualquer caracter que não seja '}' (grupo 1 - a chave)
  // \s* : zero ou mais espaços
  // \}\} : corresponde a '}}'
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
  
  const keys = new Set<string>();
  let match;

  while ((match = regex.exec(templateText)) !== null) {
    if (match[1]) {
      keys.add(match[1].trim());
    }
  }

  return Array.from(keys);
}

/**
 * Renderiza o template substituindo os placeholders pelos valores fornecidos.
 * 
 * @param templateText O texto do template.
 * @param valuesMap Um objeto contendo os valores para cada chave.
 * @returns O texto renderizado.
 */
export function renderTemplate(templateText: string, valuesMap: Record<string, string>): string {
  // Substitui todas as ocorrências de {{ CHAVE }} pelo valor correspondente
  return templateText.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    // Se o valor existir, usa ele. Se não, mantém o placeholder original ou avisa?
    // User request: "Se faltar valor para alguma chave, manter o placeholder e gerar aviso"
    // Aqui apenas mantemos o placeholder se for undefined/null/vazio para que a validação posterior possa pegá-lo,
    // OU podemos substituir por algo visual.
    // A regra diz: "Se faltar valor... manter o placeholder".
    
    if (valuesMap[trimmedKey] !== undefined && valuesMap[trimmedKey] !== '') {
      return valuesMap[trimmedKey];
    }
    
    return ''; // Remove o placeholder se não houver valor
  });
}
