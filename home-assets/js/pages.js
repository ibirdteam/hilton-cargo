document.addEventListener('alpine:init', () => {
    Alpine.data('track', () => ({
        processing: false,
        tracking_code: '',
        errors: [],
        async track() {
            this.processing = true

            const headers = new Headers()
            const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

            headers.append('X-CSRF-TOKEN', csrf)
            headers.append('Content-Type', 'application/json')

            const requestOptions = {
                method: "POST",
                headers,
                body: JSON.stringify({ tracking_code: this.tracking_code })
            }

            try {
                const data = await (await fetch(route('tracking.process'), requestOptions)).json()
                if (data.errors) {
                    this.errors = data.errors
                }

                if (data.success) {
                    this.errors = []
                    const { redirect } = data.success
                    location.href = redirect
                }

                this.processing = false

            } catch (error) {
                this.processing = false
                console.log(error)
                this.errors = ['Something went wrong, please try again later.']
            }
        }
    }))

    Alpine.data('contact', () => ({
        processing: false,
        
        contact: {},
        
        errors: {},
        success: null,

        async send() {
            this.processing = true
            
            const headers = new Headers()
            const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

            headers.append('X-CSRF-TOKEN', csrf)
            headers.append('Content-Type', 'application/json')

            const requestOptions = {
                method: "POST",
                headers,
                body: JSON.stringify(this.contact)
            }

            try {
                const { ok, data } = await (await fetch(route('contact.send'), requestOptions)).json()
                if (!ok) {
                    this.success = null;
                    this.errors = data
                }

                if (ok) {
                    this.errors = {}
                    this.contact = {}
                    this.success = data
                }

                this.processing = false

            } catch (error) {
                this.processing = false
                console.log(error)
                this.errors = {
                    general: ['Something went wrong, please try again later.'],
                }
            }

        },
    }))

})