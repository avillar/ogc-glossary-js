$(function() {

  let $glossary = $('#ogc-glossary');
  let $letters = $('<div class="glossary-letters">').appendTo($glossary);
  let $terms = $('<dl class="glossary-terms">').appendTo($glossary);
  for (let i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++) {
    $('<span class="glossary-letter">').text(String.fromCharCode(i)).appendTo($letters);
  }

  $glossary.on('click', '.glossary-letter', function() {
    viewTerms($(this).text());
  });

  viewTerms();

  function viewTerms(letter = 'A') {
    let $currentLetter = $letters.find('.active');
    if ($currentLetter.text() == letter) {
      return;
    }
    $currentLetter.removeClass('active');

    $terms.empty();

    $currentLetter = $letters.children().eq(letter.charCodeAt(0) - 65)
      .addClass('active');

    query = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      SELECT ?term ?label ?definition WHERE {
        <http://www.opengis.net/def/glossary/> skos:member ?term .
        ?term skos:prefLabel ?label; skos:definition ?definition .
        FILTER (STRSTARTS(UCASE(?label), '${letter}'))
    } ORDER BY (UCASE(?label))`;
    $.post({
        url: 'https://defs.opengis.net/vocprez/sparql/',
        headers: {
          'Accept': 'application/sparql-results+json'
        },
        data: {
          query,
        },
      })
      .then((resp) => {
        data = JSON.parse(resp);
        console.log(data);
        data.results.bindings.forEach(b => {
          $('<dt>').text(b.label.value).appendTo($terms);
          $('<dd>').text(b.definition.value).appendTo($terms);
        });
      });
  }
});
