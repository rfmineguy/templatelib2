/*MIT License

Copyright (c) 2025 Riley Fischer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

class TemplateEngine {
  async load(templatelib, to_include) {
    console.log(`========================================`)
    console.log(`Running template gen from: ${templatelib}`)
    console.log(`========================================`)

    const res = await fetch(templatelib);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const text = await res.text();

    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')

    const templates = doc.querySelectorAll('template')

    if (to_include === '*') {
      for (const el of templates) {
        document.head.appendChild(el.cloneNode(true))
        console.log(`included ${el.id}`)
      }
    }
    else {
      for (const el of templates) {
        if (to_include.includes(el.id)) {
          document.head.appendChild(el.cloneNode(true))
          console.log(`included ${el.id}`)
        }
      }
    }
  }

  // Entry point
  generate(templateId) {
    const templateEl = document.getElementById(templateId);
    if (!templateEl) {// || templateEl.tagName.toLowerCase() !== 'template') {
      console.error(`Template '${templateId}' not found or not a <template>`);
      return null;
    }

    const frag = templateEl.content.cloneNode(true);
    const wrapped = this.wrapFragment(frag);
    const result = document.createElement('div');
    wrapped.id = templateEl.id;
    this.generateFullTemplateDomRec(wrapped, result);
    return result;
  }

  populatePage() {
    const uses = document.getElementsByTagName('tpl-use');
    for (const use of uses) {
      const template = use.getAttribute('template')
      const generated = this.generate(template);
      document.querySelector('main').appendChild(generated);

      {
        // Handle 'tpl-set-value'
        const set = use.getElementsByTagName('tpl-set-value');
        for (let set_ of set) {
          const slotid = set_.getAttribute('slot-id');
          var element = generated.querySelector(slotid);
          element.innerHTML = set_.innerHTML;
        }
      }

      {
        // Handle 'tpl-set-attr'
        const set = use.getElementsByTagName('tpl-set-attr');
        for (let set_ of set) {
          const slotid = set_.getAttribute('slot-id');
          const attr = set_.getAttribute('attr');
          const val = set_.getAttribute('val');
          console.log(slotid);
          var element = generated.querySelector(slotid);
          if (!element) {
            console.err(`Element with id=${slotid} does not exist`);
            continue;
          }
          element.setAttribute(attr, val);
        }
      }
    }
    
    for (const el of document.querySelectorAll('tpl-use')) {
      el.remove();
    }
  }

  // Helper to wrap a fragment into a real DOM element
  wrapFragment(frag) {
    const container = document.createElement('div');
    container.id = frag.id;
    container.appendChild(frag);
    return container;
  }

  // Recursive expansion logic
  generateFullTemplateDomRec(templateNode, fulldom) {
    const container = document.createElement('div');

    for (const child of [...templateNode.children]) {
      if (child.tagName.toLowerCase() === 'tpl-use') {
        const templateId = child.getAttribute('template');
        const referencedTemplate = document.getElementById(templateId);
        container.id = child.id;

        if (referencedTemplate && referencedTemplate.tagName.toLowerCase() === 'template') {
          const cloned = referencedTemplate.content.cloneNode(true);
          const wrapped = this.wrapFragment(cloned);
          this.generateFullTemplateDomRec(wrapped, container);
        } else {
          console.warn(`Template '${templateId}' not found or not a <template>`);
        }
      } else {
        var x = container.appendChild(child.cloneNode(true));
        x.setAttribute('id', child.id);
      }
    }

    fulldom.appendChild(container);
    return container;
  }
}

