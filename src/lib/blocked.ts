const BLOCKED = [
  /steroid/i,
  /testosterone/i,
  /nandrol/i,
  /trenbolone/i,
  /stanozolol/i,
  /boldenone/i,
  /oxymetholone/i,
  /cut.?mix/i,
  /somatropin/i,
  /growth.?hormone/i,
  /kigtropin/i,
  /(^|[^a-z])hgh([^a-z]|$)/i,
  /zopiclone/i,
  /zopfresh/i,
  /zolpidem/i,
  /zaleplon/i,
  /eszopiclone/i,
  /sleeping pill/i,
  /modafinil/i,
  /armodafinil/i,
  /modaheal/i,
  /tramadol/i,
  /online pharmacy/i,
  /drop.?shipping/i,
];

export function isBlocked(text: string): boolean {
  return BLOCKED.some((pattern) => pattern.test(text));
}
