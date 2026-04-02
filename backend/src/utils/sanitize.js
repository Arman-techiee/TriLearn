const HTML_TAG_PATTERN = /<[^>]*>/g

const sanitizePlainText = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(HTML_TAG_PATTERN, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

module.exports = {
  sanitizePlainText
}
