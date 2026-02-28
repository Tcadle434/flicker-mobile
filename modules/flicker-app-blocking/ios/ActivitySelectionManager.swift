import Foundation
import FamilyControls
import SwiftUI
import UIKit

/// Manages the FamilyActivityPicker presentation and token serialization.
/// FamilyActivityPicker is a SwiftUI view, so we present it via UIHostingController.
@available(iOS 16.0, *)
final class ActivitySelectionManager {
    static let shared = ActivitySelectionManager()
    private init() {}

    /// Currently selected apps/categories from the picker
    var activitySelection = FamilyActivitySelection()

    /// Present the FamilyActivityPicker from the root view controller.
    /// Returns the serialized selection data, or nil if cancelled/failed.
    func presentPicker() async throws -> Data? {
        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {
                    continuation.resume(returning: nil)
                    return
                }

                let picker = FamilyActivityPickerView(selection: self) { data in
                    continuation.resume(returning: data)
                }

                let hostingController = UIHostingController(rootView: picker)
                hostingController.modalPresentationStyle = .pageSheet

                guard let rootVC = self.rootViewController else {
                    continuation.resume(throwing: AppBlockingError.noRootViewController)
                    return
                }

                rootVC.present(hostingController, animated: true)
            }
        }
    }

    /// Serialize the current selection for storage in AppGroupStorage
    func serializeSelection() -> Data? {
        try? JSONEncoder().encode(activitySelection)
    }

    /// Restore selection from serialized data
    func restoreSelection(from data: Data) {
        if let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
            activitySelection = selection
        }
    }

    private var rootViewController: UIViewController? {
        // Walk the connected scenes to find the key window's root VC
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first
        return scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
    }
}

// MARK: - SwiftUI Picker Wrapper

@available(iOS 16.0, *)
private struct FamilyActivityPickerView: View {
    @ObservedObject private var manager: ActivitySelectionObservable
    let onComplete: (Data?) -> Void

    init(selection manager: ActivitySelectionManager, onComplete: @escaping (Data?) -> Void) {
        self.manager = ActivitySelectionObservable(manager: manager)
        self.onComplete = onComplete
    }

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $manager.selection)
                .navigationTitle("Choose Apps to Block")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            dismiss(with: nil)
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            manager.save()
                            let data = manager.serialize()
                            dismiss(with: data)
                        }
                    }
                }
        }
    }

    private func dismiss(with data: Data?) {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first
        scene?.windows.first(where: { $0.isKeyWindow })?
            .rootViewController?.dismiss(animated: true) {
                onComplete(data)
            }
    }
}

@available(iOS 16.0, *)
private class ActivitySelectionObservable: ObservableObject {
    @Published var selection: FamilyActivitySelection
    private let manager: ActivitySelectionManager

    init(manager: ActivitySelectionManager) {
        self.manager = manager
        self.selection = manager.activitySelection
    }

    func save() {
        manager.activitySelection = selection
    }

    func serialize() -> Data? {
        manager.serializeSelection()
    }
}

// MARK: - Errors

enum AppBlockingError: Error, LocalizedError {
    case noRootViewController
    case authorizationDenied
    case notAuthorized
    case serializationFailed

    var errorDescription: String? {
        switch self {
        case .noRootViewController:
            return "Could not find root view controller to present picker."
        case .authorizationDenied:
            return "Family Controls authorization was denied."
        case .notAuthorized:
            return "Family Controls is not authorized. Please enable Screen Time permissions."
        case .serializationFailed:
            return "Failed to serialize app selection."
        }
    }
}
