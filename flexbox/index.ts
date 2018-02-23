class Flexbox extends HTMLElement {

    private _innerElt = document.createElement('mu-flexbox-inner')

    get diffWidth() { return this.offsetWidth - this._innerElt.offsetWidth }

    notice() {
        this.style.paddingLeft = `${this.diffWidth / 2}px`
    }

    init() {
        this._innerElt.innerHTML = this.innerHTML
        this.innerHTML = ''
        this.appendChild(this._innerElt)
    }
    
    constructor() {
        super()
        this.init()
        this.notice()
    }
}
customElements.define('mu-flexbox', Flexbox)