import random
from frappe.model.document import Document

class ExamQuestions(Document):
    def validate(self):
        self.assign_random_prototypes()

    def assign_random_prototypes(self):
        prototypes = [
            self.prototype_1, 
            self.prototype_2, 
            self.prototype_3, 
            self.prototype_4
        ]
        
        # Remove empty prototypes
        prototypes = [proto for proto in prototypes if proto]
        
        if prototypes:
            self.first_round_selected_prototype = random.choice(prototypes)
            self.second_round_selected_prototype = random.choice(prototypes)
            self.third_round_selected_prototype = random.choice(prototypes)
