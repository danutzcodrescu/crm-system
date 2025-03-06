import * as cheerio from 'cheerio';

export function removeQuotedReplies(text: string) {
  const $ = cheerio.load(text);

  // Find all elements with lang attribute
  $('[lang]').each(function () {
    const $element = $(this);
    let $parent = $element.parent();
    let foundQuoteParent = false;

    // Recursively check parents for the specific style
    while ($parent.length && !foundQuoteParent) {
      const styleAttr = $parent.attr('style') || '';

      if (styleAttr.includes('border:none;border-top:solid')) {
        foundQuoteParent = true;

        // Get all siblings that come after this parent
        let $nextSiblings = $parent.nextAll();

        // Remove the parent and all following siblings
        $parent.remove();
        $nextSiblings.remove();
      } else {
        // Move up to the next parent
        $parent = $parent.parent();
      }
    }
  });

  $('#divRplyFwdMsg').each(function () {
    const $element = $(this);
    $element.prev().remove();
    $element.nextAll().remove();
    $element.remove();
  });

  return $.html();
}

export function cleanEmptyTags(text: string) {
  const $ = cheerio.load(text);
  $('*:is(span, p, div)').each(function () {
    const $this = $(this);
    // Check if the HTML content is just &nbsp; or its encoded form
    if ($this.html() === '&nbsp;' || $this.html() === '\u00A0' || $this.html() === ' ') {
      // Remove the element
      $this.remove();
    }
  });

  return $.html();
}

export function cleanGmailReply(text: string) {
  const $ = cheerio.load(text);
  const replyContainer = $('blockquote');

  replyContainer.each(function () {
    const $this = $(this);
    const previousElement = $this.prev();

    // Check if previous element contains an 'a' tag with 'mailto' href
    if (previousElement.length && previousElement.find('a[href^="mailto:"]').length > 0) {
      // Remove both the previous element and the blockquote
      previousElement.remove();
      $this.remove();
    }
  });

  return $.html();
}
