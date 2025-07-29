import Foundation
import Capacitor
import Stripe
import StripePaymentSheet

@objc(StripePaymentPlugin)
public class StripePaymentPlugin: CAPPlugin {
    private var paymentSheet: PaymentSheet?
    
    @objc func presentPaymentSheet(_ call: CAPPluginCall) {
        guard let paymentIntentClientSecret = call.getString("paymentIntentClientSecret") else {
            call.reject("Missing paymentIntentClientSecret")
            return
        }
        
        guard let customerId = call.getString("customerId") else {
            call.reject("Missing customerId")
            return
        }
        
        guard let customerEphemeralKeySecret = call.getString("customerEphemeralKeySecret") else {
            call.reject("Missing customerEphemeralKeySecret")
            return
        }
        
        // Configure Payment Sheet
        var configuration = PaymentSheet.Configuration()
        configuration.merchantDisplayName = "StockMatcher AI"
        configuration.customer = .init(id: customerId, ephemeralKeySecret: customerEphemeralKeySecret)
        configuration.allowsDelayedPaymentMethods = true
        configuration.appearance = self.createPaymentSheetAppearance()
        
        DispatchQueue.main.async {
            self.paymentSheet = PaymentSheet(paymentIntentClientSecret: paymentIntentClientSecret, configuration: configuration)
            
            guard let viewController = self.bridge?.viewController else {
                call.reject("Unable to get view controller")
                return
            }
            
            self.paymentSheet?.present(from: viewController) { [weak self] paymentResult in
                switch paymentResult {
                case .completed:
                    call.resolve(["status": "completed"])
                case .canceled:
                    call.resolve(["status": "canceled"])
                case .failed(let error):
                    call.reject("Payment failed: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func createPaymentSheetAppearance() -> PaymentSheet.Appearance {
        var appearance = PaymentSheet.Appearance()
        
        // Customize colors to match your app theme
        appearance.colors.primary = UIColor(red: 0.31, green: 0.27, blue: 0.90, alpha: 1.0) // Blue-600
        appearance.colors.background = UIColor.systemBackground
        appearance.colors.componentBackground = UIColor.secondarySystemBackground
        appearance.colors.componentBorder = UIColor.separator
        appearance.colors.componentDivider = UIColor.separator
        appearance.colors.text = UIColor.label
        appearance.colors.textSecondary = UIColor.secondaryLabel
        appearance.colors.componentText = UIColor.label
        // Note: placeholderText property was removed in newer Stripe SDK versions
        appearance.colors.icon = UIColor.label
        appearance.colors.danger = UIColor.systemRed
        
        // Font customization
        appearance.font.base = UIFont.systemFont(ofSize: 16)
        appearance.font.sizeScaleFactor = 1.0
        
        // Corner radius
        appearance.cornerRadius = 12.0
        appearance.borderWidth = 1.0
        
        return appearance
    }
}