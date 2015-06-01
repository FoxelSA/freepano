
(function($){

$.extend($.fn,{

  // get or set style from css stylesheets
  style: function jquery_style(from,override) {

    if (from) {
      return this.css($.extend(css.get(from),override));
    }

    var css_properties={}
    this.each(function(){
      css_properties=css.get(this);
      return false;
    });

    return css_properties;

  } // jquery_style;

});

var css={

  get: function css_get(elem) {

    var sheets=document.styleSheets;
    var css_properties={};
    var match;

    elem=$(elem);

    for (var s in sheets) {
      var rules=sheets[s].rules || sheets[s].cssRules;

      for (var r in rules) {
        if (!rules[r].selectorText) {
          continue;
        }

        // jQuery.fn.is() is not working with :hover and :active
        // split selectorText to minimize the bug impact
        $.each(rules[r].selectorText.split(','),function(i,selector) {

          try {
            match=elem.is(selector.trim());

          } catch(e) {
            //console.log(e);
            return true;
          }

          if (match) {
            css_properties=$.extend(
              css_properties,
              css.parse(rules[r].style),
              css.parse(elem.attr('style'))
            );
          }

        });
      }

    }

    return css_properties;

  }, // css_get

  parse: function css_parse(declaration) {

    var css_properties={};

    if (declaration instanceof CSSStyleDeclaration) {
        for (var d in declaration) {
            if (declaration[d].toLowerCase) {
                css_properties[(declaration[d]).toLowerCase()] = declaration[declaration[d]];
            }
        }

    } else if (typeof declaration == 'string') {
        for (var property_index in declaration.split(';')) {
            var css_statement=css[property_index].trim().split(':');
            var property_name=css_statement[0].trim().toLowerCase();
            var property_value=css_statement[1].trim();
            css_properties[property_name]=property_value;
        }
    }

    return css_properties;

  } // css_parse
}

})(jQuery);
