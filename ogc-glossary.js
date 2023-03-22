$(function() {

  let $glossary = $('#ogc-glossary');
  let $letters = $('<div class="glossary-letters">').appendTo($glossary);
  for (let i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++) {
    $('<span class="glossary-letter">').text(String.fromCharCode(i)).appendTo($letters);
  }
  $('<span class="glossary-letter search-letter">').text('🔎').appendTo($letters);

  $letters.eq(0).addClass('active');

  let $searchForm = $('<form class="glossary-search">').hide().appendTo($glossary);
  let $searchField = $('<input class="glossary-search-box" placeholder="Find terms...">').appendTo($searchForm);
  let $searchDesc = $('<input type="checkbox">');
  $('<label>').text('In descriptions').prepend($searchDesc).appendTo($searchForm);
  $('<button type="submit">Search</button>').appendTo($searchForm);
  let $searchError = $('<div class="search-error">').text('Invalid query').hide().appendTo($glossary);

  let $terms = $('<dl class="glossary-terms">').appendTo($glossary);

  $glossary.on('click', '.glossary-letter', function() {
    if ($(this).hasClass('active')) {
      return;
    }
    $letters.find('.active').removeClass('active');
    $(this).addClass('active');
    if ($(this).hasClass('search-letter')) {
      $terms.empty();
      $searchForm.show();
    } else {
      $searchForm.hide();
      viewTerms($(this).text());
    }
  });

  $searchForm.submit(function(e) {
    e.preventDefault();
    $terms.empty();
    search($searchField.val(), $searchDesc.is(':checked'));
  });
  $searchField.change(function() {
    $searchError.hide();
  });

  viewTerms();

  function getSparlTerms(query) {
    $terms.empty();
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
        let data = JSON.parse(resp);
        if (data?.results?.bindings?.length) {
          data.results.bindings.forEach(b => {
            $('<dt>').text(b.label.value).appendTo($terms);
            $('<dd>').text(b.definition.value).appendTo($terms);
          });
        } else {
          $terms.text('No results');
        }
      });
  }

  function search(q, desc = false) {
    $searchError.hide();
    q = q.toLowerCase().replaceAll(/[^a-z0-9]+/g, ' ').trim();
    if (q.length < 3) {
      $searchError.show();
      return;
    }
    q = q.split(' ');
    let filter = q.map(t => `REGEX(?label, '\\\\b${t}', 'i')`).join(' && ');
    if (desc) {
      let descFilter = q.map(t => `REGEX(?definition, '\\\\b${t}')`)
        .join(' && ');
      filter = `(${filter}) || (${descFilter})`;
    }
    const query = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      SELECT ?term ?label ?definition WHERE {
          <http://www.opengis.net/def/glossary/> skos:member ?term .
          ?term skos:prefLabel ?label; skos:definition ?definition .
          FILTER (${filter})
      } ORDER BY (UCASE(?label))
    `;
    getSparlTerms(query);
  }

  function viewTerms(letter = 'A') {
    $currentLetter = $letters.children().eq(letter.charCodeAt(0) - 65)
      .addClass('active');

    let query = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      SELECT ?term ?label ?definition WHERE {
        <http://www.opengis.net/def/glossary/> skos:member ?term .
        ?term skos:prefLabel ?label; skos:definition ?definition .
        FILTER (STRSTARTS(UCASE(?label), '${letter}'))
      } ORDER BY (UCASE(?label))
    `;
    getSparlTerms(query);
  }
});
